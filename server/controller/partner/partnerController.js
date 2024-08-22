const partner = require("../../Models/partner/partnerModel");
const Booking = require("../../Models/BookingModel");
const User = require("../../Models/userModel");
const Commission = require("../../Models/commissionModel")
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

    // Check if the partner is blocked or suspended
    if (partnerUpdate.isBlocked || partnerUpdate.isSuspended) {
      return res.status(400).json({
        message: "Your account has been suspended or blocked! Please contact your admin.",
        success: false
      });
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
      return res.status(404).json({
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
      return res.status(404).json({ message: "Booking request not found" });
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



const getTopPartners = async (req, res) => {
  const { unitType, unitClassification, subClassification, bookingId } = req.body;

  try {
    // Query partners matching criteria
    const partners = await partner.find({
      "operators.unitType": unitType,
      "operators.unitClassification": unitClassification,
      ...(subClassification && { "operators.subClassification": subClassification })
    }).populate('operators.bookingRequest');

    // Prepare filtered results
    const filteredPartners = partners.reduce((filtered, partner) => {
      const matchingOperators = partner.operators.filter(operator =>
        operator.unitType === unitType &&
        operator.unitClassification === unitClassification &&
        (!subClassification || operator.subClassification === subClassification)
      );

      matchingOperators.forEach(operator => {
        // Check if operator.bookingRequest is an array and filter for the given bookingId
        if (Array.isArray(operator.bookingRequest)) {
          operator.bookingRequest = operator.bookingRequest.filter(booking => {
            // Ensure bookingId is not null and valid before comparison
            const bookingIdValid = bookingId && bookingId.toString();
            const bookingIdMatch = booking.bookingId && booking.bookingId.toString();
            return bookingIdValid && bookingIdMatch && bookingIdValid === bookingIdMatch;
          });
        }
      });

      // Check if any matching operators with valid bookingRequest
      if (matchingOperators.length > 0) {
        filtered.push({
          partnerId: partner._id,
          partnerName: partner.partnerName,
          operators: matchingOperators
        });
      }

      return filtered;
    }, []);

    // Flatten the results into the desired format
    const results = [];
    for (const partner of filteredPartners) {
      for (const operator of partner.operators) {
        for (const booking of operator.bookingRequest) {
          // Fetch user details from booking collection
          const bookingDetails = await Booking.findById(booking.bookingId);
          if (!bookingDetails) {
            throw new Error('Booking not found');
          }
          const userId = bookingDetails.user;
          
          // Fetch user details from User collection
          const user = await User.findById(userId);
          if (!user) {
            throw new Error('User not found');
          }

          const accountType = user.accountType;

          // Fetch commission rate from Commission collection
          const commission = await Commission.findOne({ userType: accountType });
          if (!commission) {
            throw new Error('Commission rate not found');
          }

          // Convert commission rate percentage to a decimal
          const commissionRate = commission.commissionRate / 100;
          const quotePrice = booking.quotePrice;
          const quotePriceWithCommission = quotePrice * commissionRate;

          // Calculate the final quote price with commission if quotePrice is not null
          const finalQuotePrice = quotePrice != null ? (quotePrice + quotePriceWithCommission) : quotePrice;

          results.push({
            partnerId: partner.partnerId,
            partnerName: partner.partnerName,
            quotePrice: finalQuotePrice,
            unitType: operator.unitType,
            unitClassification: operator.unitClassification,
            subClassification: operator.subClassification,
            bookingId: booking.bookingId,
            oldQuotePrice: quotePrice,
            operatorFirstName: operator.firstName,
            operatorLastName: operator.lastName,
            operatorMobileNo: operator.mobileNo,
          });
        }
      }
    }

    // Sort results by quotePrice in ascending order and take the top 3
    const topResults = results.sort((a, b) => a.quotePrice - b.quotePrice).slice(0, 3);

    // Return the final results
    res.status(200).json({
      success: true,
      data: topResults,
    });

  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};




const handleBookingPaymentStatusUpdate = async (bookingId, newPaymentStatus) => {
  try {
    // Find all partners that have this bookingId in their operators
    const partnersToUpdate = await partner.find({
      "operators.bookingRequest.bookingId": bookingId,
      // Optionally, filter by paymentStatus if needed
      "operators.bookingRequest.paymentStatus": newPaymentStatus
    });

    // Update each partner's operators to remove the bookingRequest
    await Promise.all(partnersToUpdate.map(async (partner) => {
      partner.operators.forEach(operator => {
        const index = operator.bookingRequest.findIndex(req => req.bookingId === bookingId);
        if (index !== -1) {
          operator.bookingRequest.splice(index, 1);
        }
      });
      await partner.save();
    }));
  } catch (error) {
    console.error("Error handling booking payment status update:", error);
    throw error; // Handle error as needed
  }
};


const getAllPartners = async (req, res) => {
  try {
    const partners = await partner.find({});
    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const updatePartnerStatus = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const { isBlocked, isSuspended } = req.body;

    const partnerStatus = await partner.findByIdAndUpdate(partnerId, { isBlocked, isSuspended }, { new: true });

    if (!partnerStatus) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    res.status(200).json({ success: true, data: partnerStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error updating partner status', error: error.message });
  }
};


const addCompanyDetails = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const {
      companyName,
      legalName,
      phoneNumber,
      alternativePhoneNumber,
      address,
      city,
      zipCode,
      companyType,
      companyIdNo,
      partnerName
    } = req.body;

    // Find the partner by ID
    const partnerDetails = await partner.findById(partnerId);

    if (!partnerDetails) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Check if partner type is "multipleUnits"
    if (partnerDetails.type !== "multipleUnits") {
      return res.status(400).json({ message: 'Can add companyDetails only for partner type multipleUnits' });
    }

    // Check if company details already exist
    if (partnerDetails.companyDetails.length > 0) {
      return res.status(400).json({ message: 'Company details already exist' });
    }

    // Add company details to the partner
    partnerDetails.companyDetails.push({
      companyName,
      legalName,
      phoneNumber,
      alternativePhoneNumber,
      address,
      city,
      zipCode,
      companyType,
      companyIdNo,
      partnerName
    });

    // Save the updated partner document
    partnerDetails.partnerName = req.body.partnerName;
    await partnerDetails.save();

    res.status(200).json({
      message: 'Company details added successfully',
      companyDetails: partnerDetails.companyDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


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
  const from = "+12563716772"; // Replace with your Twilio phone number
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
exports.handleBookingPaymentStatusUpdate = handleBookingPaymentStatusUpdate;
exports.getAllPartners = getAllPartners;
exports.updatePartnerStatus = updatePartnerStatus;
exports.addCompanyDetails = addCompanyDetails;