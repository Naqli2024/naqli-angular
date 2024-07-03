const partner = require("../../Models/partner/partnerModel");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const twilio = require("twilio");

/*****************************************
            Partner registration
 ****************************************/
const partnerRegister = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existPartner = await partner.findOne({ email: req.body.email });
    if (existPartner) {
      return res.status(400).json({
        message: "Partner already exists",
        success: false,
        data: null,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Create new partner with OTP and its expiry time
    const newPartner = new partner({
      ...req.body,
      resetOTP: otp,
      otpExpiry: Date.now() + 300000, // 5 minutes expiry
    });
    await newPartner.save();

    // Send OTP to partner's mobile number
    try {
      const otpResponse = await sendOTP(req.body.mobileNo, otp);

      res.status(200).json({
        message: "Partner created successfully. OTP sent to mobile number.",
        success: true,
        data: {
          otpResponse: otpResponse.data,
          partner: newPartner,
        },
      });
    } catch (otpError) {
      res.status(500).json({
        message: "Partner created but failed to send OTP.",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Error during partner registration:", error.message);
    res.status(400).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};



const updatePartnerName = async (req, res) => {
  const { partnerId } = req.params;
  const { partnerName } = req.body;

  try {
    const updatedPartner = await partner.findByIdAndUpdate(
      partnerId,
      { partnerName },
      { new: true }
    );

    if (!updatedPartner) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json(updatedPartner);
  } catch (err) {
    console.error("Error updating partner name:", err);
    res.status(500).json({ error: "Server error" });
  }
};



const checkPartnerExists = async (req, res) => {
  try {
    const { partnerName } = req.params;
    const existingPartner = await partner.findOne({ partnerName });

    // Return true if partnerName exists, false otherwise
    res.json(!!existingPartner);
  } catch (error) {
    console.error("Error checking partner existence:", error);
    res.status(500).json({ error: "Server error" });
  }
};



const updateQuotePrice = async (req, res) => {
  const { quotePrice, partnerId, bookingId } = req.body;

  try {
    // Validate inputs
    if (!partnerId || !bookingId || !quotePrice) {
      return res
        .status(400)
        .json({ message: "Missing required fields", success: false });
    }

    // Find the partner by ID
    const partnerUpdate = await partner.findById(partnerId);
    if (!partnerUpdate) {
      return res
        .status(404)
        .json({ message: "Partner not found", success: false });
    }

    // Ensure operators array exists and is not empty
    partnerUpdate.operators = partnerUpdate.operators || [];

    let bookingFound = false;

    // Iterate through operators and their booking requests
    partnerUpdate.operators.forEach((operator) => {
      operator.bookingRequest.forEach((booking) => {
        // Check if bookingId matches
        if (booking && booking.bookingId.toString() === bookingId) {
          booking.quotePrice = quotePrice; // Update quotePrice for the booking
          bookingFound = true;
        }
      });
    });

    // If bookingId was not found, return error
    if (!bookingFound) {
      return res
        .status(404)
        .json({
          message: "Booking ID not found for this partner",
          success: false,
        });
    }

    // Save the updated partner document
    const updatedPartner = await partnerUpdate.save();

    res.status(200).json({
      success: true,
      message: "Quote price updated successfully",
      partner: updatedPartner,
    });
  } catch (error) {
    console.error("Error in updateQuotePrice:", error);
    res.status(500).json({ message: error.message, success: false });
  }
};



const deletedBookingRequest = async (req, res) => {
  const { partnerId, bookingId } = req.params;

  try {
    const partnerExists = await partner.findById(partnerId);

    if (!partnerExists) {
      return res.status(404).json({ message: "Partner not found" });
    }

    let bookingRequestDeleted = false;

    partnerExists.operators.forEach((operator) => {
      const initialLength = operator.bookingRequest.length;
      operator.bookingRequest = operator.bookingRequest.filter(
        (request) => request.bookingId.toString() !== bookingId
      );
      if (operator.bookingRequest.length < initialLength) {
        bookingRequestDeleted = true;
      }
    });

    if (!bookingRequestDeleted) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    await partnerExists.save();

    res
      .status(200)
      .json({ success: true, message: "Booking request deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking request:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const getTopPartners = async(req, res) => {
  const { unitType, unitClassification, subClassification } = req.body;

  try {
    const results = await partner.aggregate([
      { $unwind: "$operators" },
      { $unwind: "$operators.bookingRequest" },
      // Match the operators based on unitType and unitClassification
      {
        $match: {
          "operators.unitType": unitType,
          "operators.unitClassification": unitClassification,
          ...(subClassification && { "operators.subClassification": subClassification }),
        },
      },
      // Project the necessary fields
      {
        $project: {
          partnerName: "$partnerName",
          quotePrice: "$operators.bookingRequest.quotePrice",
          unitType: "$operators.unitType",
          unitClassification: "$operators.unitClassification",
          subClassification: {
            $cond: {
              if: { $eq: [{ $ifNull: ["$operators.subClassification", ""] }, ""] },
              then: "$$REMOVE",
              else: "$operators.subClassification"
            }
          }
        },
      },
      // Sort by quotePrice in ascending order
      { $sort: { "quotePrice": 1 } },
      // Limit to top 3 results
      { $limit: 3 },
    ]);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching top 3 partners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}


/*****************************************
            Send OTP 
 *****************************************/
// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to send OTP to the partner's mobile number using Twilio
const sendOTP = async (mobileNo, otp) => {
  const from = "+12086469792"; // Replace with your Twilio phone number
  const to = `+${mobileNo}`;
  const text = `Your verification code is ${otp}`;

  try {
    const message = await client.messages.create({
      body: text,
      from: from,
      to: to,
    });

    console.log("Message sent successfully");
    console.log(message);

    return {
      message: `OTP sent to ${mobileNo}`,
      success: true,
      data: { messageId: message.sid },
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      message: "Error sending OTP",
      success: false,
      data: null,
    };
  }
};

/********************************************
          Resend OTP
 *******************************************/
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const existPartner = await partner.findOne({ email });

    if (!existPartner) {
      return res.status(400).json({
        message: "Partner not found",
        success: false,
        data: null,
      });
    }

    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

    // Update partner's OTP and OTP expiry
    existPartner.resetOTP = newOTP;
    existPartner.otpExpiry = Date.now() + 300000; // 5 minutes expiry

    await existPartner.save();

    // Send new OTP to partner's mobile number
    const otpResponse = await sendOTP(existPartner.mobileNo, newOTP); // Use your sendOTP function

    if (otpResponse.success) {
      return res.status(200).json({
        message: "New OTP sent successfully",
        success: true,
        data: { messageId: otpResponse.data.messageId }, // Optionally, you can include message ID or other data
      });
    } else {
      return res.status(500).json({
        message: "Failed to send new OTP",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    res.status(500).json({
      message: "Error resending OTP",
      success: false,
      data: null,
    });
  }
};

/********************************************
              Verify OTP
 *******************************************/
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // Find the partner by the OTP received during registration
    const existPartner = await partner.findOne({ resetOTP: otp });

    if (!existPartner) {
      return res.status(400).json({
        message: "Incorrect OTP",
        success: false,
        data: null,
      });
    }

    // Check OTP expiry (if needed, depending on your application logic)
    if (existPartner.otpExpiry && existPartner.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "Expired OTP",
        success: false,
        data: null,
      });
    }

    // Mark partner as verified and clear OTP fields
    existPartner.isVerified = true;
    existPartner.resetOTP = null;
    existPartner.otpExpiry = null;
    await existPartner.save();

    res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      data: null, // You can include additional data if needed
    });
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    res.status(400).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

exports.partnerRegister = partnerRegister;
exports.verifyOTP = verifyOTP;
exports.resendOTP = resendOTP;
exports.sendOTP = sendOTP;
exports.updatePartnerName = updatePartnerName;
exports.checkPartnerExists = checkPartnerExists;
exports.updateQuotePrice = updateQuotePrice;
exports.deletedBookingRequest = deletedBookingRequest;
exports.getTopPartners = getTopPartners;