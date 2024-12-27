const partner = require("../../Models/partner/partnerModel");
const Booking = require("../../Models/BookingModel");
const User = require("../../Models/userModel");
const Commission = require("../../Models/commissionModel");
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

    // Check if partner selected "enterprise" as the type
    if (req.body.type === "enterprise") {
      return res.status(400).json({
        message: "The 'Enterprise' partner type is currently unavailable. This feature will be available in upcoming releases.",
        success: false,
        data: null,
      });
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
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // Find the partner by ID
    const partnerUpdate = await partner.findById(partnerId);
    if (!partnerUpdate) {
      return res.status(404).json({
        message: "Partner not found",
        success: false,
      });
    }

    // Check if the partner is blocked or suspended
    if (partnerUpdate.isBlocked || partnerUpdate.isSuspended) {
      return res.status(400).json({
        message:
          "Your account has been suspended or blocked! Please contact your admin.",
        success: false,
      });
    }

    // Ensure bookingRequest array exists
    partnerUpdate.bookingRequest = partnerUpdate.bookingRequest || [];

    // Check if the partner type is 'singleUnit + operator'
    if (partnerUpdate.type === "singleUnit + operator") {
      // Check if any booking has quotePrice set, paymentStatus exists, and bookingStatus is not 'Completed'
      const pendingPaymentBooking = partnerUpdate.bookingRequest.some(
        (booking) =>
          booking.quotePrice != null && // Ensure quotePrice is already set
          !booking.hasOwnProperty("paymentStatus") && // Ensure paymentStatus exists
          booking.bookingStatus !== "Completed" // Ensure bookingStatus is not 'Completed'
      );

      // If such a booking exists, throw an error
      if (pendingPaymentBooking) {
        return res.status(400).json({
          message:
            "User payment status not updated in your last request. Please wait!",
          success: false,
        });
      }
    }

    // Check if the bookingId exists in the bookingRequest array
    const booking = partnerUpdate.bookingRequest.find(
      (b) => b.bookingId.toString() === bookingId
    );

    if (booking) {
      // Update quotePrice for the found booking
      booking.quotePrice = quotePrice;
    } else {
      // If bookingId was not found, return an error
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
    // Find the partner by ID
    const partnerExists = await partner.findById(partnerId);

    // Check if partner exists
    if (!partnerExists) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Filter out the booking request from the partner's bookingRequest array
    const initialLength = partnerExists.bookingRequest.length;
    partnerExists.bookingRequest = partnerExists.bookingRequest.filter(
      (request) => request.bookingId.toString() !== bookingId
    );

    // If no booking request was deleted (i.e., no change in the array length), return an error
    if (partnerExists.bookingRequest.length === initialLength) {
      return res.status(404).json({ message: "Booking request not found" });
    }

    // Save the updated partner document
    await partnerExists.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Booking request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTopPartners = async (req, res) => {
  const { unitType, unitClassification, subClassification, bookingId } =
    req.body;

  try {
    // Query partners matching criteria
    const partners = await partner.find({
      "operators.unitType": unitType,
      "operators.unitClassification": unitClassification,
      ...(subClassification && {
        "operators.subClassification": subClassification,
      }),
    });

    // Prepare filtered results
    const filteredPartners = partners.reduce((filtered, partner) => {
      const matchingOperators = partner.operators.filter(
        (operator) =>
          operator.unitType === unitType &&
          operator.unitClassification === unitClassification &&
          (!subClassification ||
            operator.subClassification === subClassification)
      );

      const filteredBookingRequests = partner.bookingRequest.filter(
        (booking) => {
          const bookingIdValid = bookingId && bookingId.toString();
          const bookingIdMatch =
            booking.bookingId && booking.bookingId.toString();
          return (
            bookingIdValid &&
            bookingIdMatch &&
            bookingIdValid === bookingIdMatch
          );
        }
      );

      if (matchingOperators.length > 0) {
        filtered.push({
          partnerId: partner._id.toString(),
          partnerName: partner.partnerName,
          operators: matchingOperators,
          bookingRequests: filteredBookingRequests,
        });
      }

      return filtered;
    }, []);

    // Flatten the results into the desired format
    const results = [];
    for (const partner of filteredPartners) {
      if (!partner.partnerId) continue; // Ensure partnerId is not undefined

      for (const booking of partner.bookingRequests) {
        // Fetch user details from booking collection
        const bookingDetails = await Booking.findById(booking.bookingId);
        if (!bookingDetails) continue;

        const userId = bookingDetails.user;
        const user = await User.findById(userId);
        if (!user) continue;

        const accountType = user.accountType;
        const commission = await Commission.findOne({ userType: accountType });
        if (
          !commission ||
          !commission.slabRates ||
          commission.slabRates.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message: "Commission slabs not found for user type",
          });
        }

        const quotePrice = booking.quotePrice;

        // Determine the applicable slab rate based on the amount
        let commissionRate = 0;
        for (const slab of commission.slabRates) {
          if (
            quotePrice >= slab.slabRateStart &&
            quotePrice <= slab.slabRateEnd
          ) {
            commissionRate = parseFloat(slab.commissionRate) / 100; // Convert to decimal
            break;
          }
        }

        if (commissionRate === 0) {
          return res.status(400).json({
            success: false,
            message: "Commission rate not applicable for the given amount",
          });
        }

        const finalQuotePrice =
          quotePrice != null
            ? parseFloat((quotePrice * (1 + commissionRate)).toFixed(0))
            : quotePrice;

        // Find the matching operator details for the current partner
        const operator = partner.operators.find(
          (op) =>
            op.unitType === unitType &&
            op.unitClassification === unitClassification &&
            (!subClassification || op.subClassification === subClassification)
        );

        if (!operator) continue; // Ensure operator is found

        results.push({
          partnerId: partner.partnerId, // Use the already set partnerId
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

    // Filter out entries with null or undefined quotePrice
    const validResults = results.filter((result) => result.quotePrice != null);

    // Sort the valid results by ascending quotePrice
    const sortedResults = validResults.sort(
      (a, b) => a.quotePrice - b.quotePrice
    );

    // Return based on the number of valid results
    if (sortedResults.length === 1) {
      // Only one result, return it
      return res.status(200).json({
        success: true,
        data: sortedResults,
      });
    } else if (sortedResults.length === 2) {
      // Two results, return both in ascending order
      return res.status(200).json({
        success: true,
        data: sortedResults,
      });
    } else if (sortedResults.length >= 3) {
      // More than three results, return the top 3 in ascending order
      const topResults = sortedResults.slice(0, 3);
      return res.status(200).json({
        success: true,
        data: topResults,
      });
    } else {
      // No valid quotePrices, return empty data
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const handleBookingPaymentStatusUpdate = async (
  bookingId,
  newPaymentStatus
) => {
  try {
    // Find all partners that have this bookingId in their operators
    const partnersToUpdate = await partner.find({
      "operators.bookingRequest.bookingId": bookingId,
      // Optionally, filter by paymentStatus if needed
      "operators.bookingRequest.paymentStatus": newPaymentStatus,
    });

    // Update each partner's operators to remove the bookingRequest
    await Promise.all(
      partnersToUpdate.map(async (partner) => {
        partner.operators.forEach((operator) => {
          const index = operator.bookingRequest.findIndex(
            (req) => req.bookingId === bookingId
          );
          if (index !== -1) {
            operator.bookingRequest.splice(index, 1);
          }
        });
        await partner.save();
      })
    );
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
      data: partners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePartnerStatus = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const { isBlocked, isSuspended } = req.body;

    const partnerStatus = await partner.findByIdAndUpdate(
      partnerId,
      { isBlocked, isSuspended },
      { new: true }
    );

    if (!partnerStatus) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({ success: true, data: partnerStatus });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating partner status", error: error.message });
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
      partnerName,
    } = req.body;

    // Find the partner by ID
    const partnerDetails = await partner.findById(partnerId);

    if (!partnerDetails) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if partner type is "multipleUnits"
    if (partnerDetails.type !== "multipleUnits") {
      return res.status(400).json({
        message: "Can add companyDetails only for partner type multipleUnits",
      });
    }

    // Check if company details already exist
    if (partnerDetails.companyDetails.length > 0) {
      return res.status(400).json({ message: "Company details already exist" });
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
      partnerName,
    });

    // Save the updated partner document
    partnerDetails.partnerName = req.body.partnerName;
    await partnerDetails.save();

    res.status(200).json({
      message: "Company details added successfully",
      companyDetails: partnerDetails.companyDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const assignOperator = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { unit, operatorName } = req.body;

    // Find the booking by its ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Find the partner by ID from the booking
    const partnerId = booking.partner;
    const partnerFound = await partner.findById(partnerId);
    if (!partnerFound) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Find the booking request object in the partner's bookingRequest array
    const bookingRequest = partnerFound.bookingRequest.find(
      (req) => req.bookingId.toString() === booking._id.toString()
    );

    if (!bookingRequest) {
      return res.status(404).json({
        message: "Booking request not found in partner's bookingRequest array",
      });
    }

    // Check if the partner type is "multipleUnits"
    if (partnerFound.type === "multipleUnits") {
      // Check in both operators and extraOperators for the operator
      let newOperator, newOperatorDetail, newOperatorMobileNo, newOperatorId;

      // Search in regular operators
      newOperator = partnerFound.operators.find((op) =>
        op.operatorsDetail.some(
          (detail) => `${detail.firstName} ${detail.lastName}` === operatorName
        )
      );

      // If not found in regular operators, search in extraOperators
      if (!newOperator) {
        newOperator = partnerFound.extraOperators.find(
          (op) => `${op.firstName} ${op.lastName}` === operatorName
        );

        if (newOperator) {
          newOperatorDetail = newOperator;
          newOperatorMobileNo = newOperator?.mobileNo || "";
          newOperatorId = newOperator?._id || "";
        }
      } else {
        // Extract new operator's details from regular operators
        newOperatorDetail = newOperator.operatorsDetail.find(
          (detail) => `${detail.firstName} ${detail.lastName}` === operatorName
        );
        newOperatorMobileNo = newOperatorDetail?.mobileNo || "";
        newOperatorId = newOperatorDetail._id || "";
      }

      if (newOperatorDetail) {
        // Ensure the new operator is available and not already assigned to another booking
        const isOperatorAssigned = partnerFound.bookingRequest.some(
          (req) =>
            req.unitType === unit &&
            req.assignedOperator &&
            req.assignedOperator.operatorName === operatorName &&
            req.assignedOperator.operatorMobileNo === newOperatorMobileNo &&
            req.bookingId.toString() !== booking._id.toString()
        );

        // Check if the unit is assigned and the booking status is not 'Completed'
        const isUnitAvailable = partnerFound.bookingRequest.some(
          (req) =>
            req.assignedOperator?.unit === unit &&
            req.bookingStatus !== "Completed"
        );

        if (
          isOperatorAssigned ||
          newOperatorDetail.status === "Not available"
        ) {
          return res
            .status(400)
            .json({ message: "This operator is not available" });
        }

        // Check if the unit is already assigned to another booking and not completed
        if (isUnitAvailable) {
          return res
            .status(400)
            .json({ message: "This unit is not available" });
        }

        // Remove "Not available" status from the previously assigned operator
        if (bookingRequest.assignedOperator) {
          const previousOperator =
            partnerFound.operators.find((op) =>
              op.operatorsDetail.some(
                (detail) =>
                  `${detail.firstName} ${detail.lastName}` ===
                  bookingRequest.assignedOperator.operatorName
              )
            ) ||
            partnerFound.extraOperators.find(
              (op) =>
                `${op.firstName} ${op.lastName}` ===
                bookingRequest.assignedOperator.operatorName
            );

          if (previousOperator) {
            const previousOperatorDetail =
              previousOperator.operatorsDetail?.find(
                (detail) =>
                  `${detail.firstName} ${detail.lastName}` ===
                  bookingRequest.assignedOperator.operatorName
              ) || previousOperator;

            if (previousOperatorDetail) {
              previousOperatorDetail.status = "available"; // Mark the previous operator as available
            }
          }
        }

        // Assign the new operator and mark them as 'Not available'
        newOperatorDetail.status = "Not available";
        bookingRequest.assignedOperator = {
          bookingId: booking._id,
          unit,
          operatorName,
          operatorMobileNo: newOperatorMobileNo,
          operatorId: newOperatorId,
        };

        // Save the updated partner document
        await partnerFound.save();

        res.status(200).json({
          message: "Operator assigned successfully",
          partnerFound,
          bookingId,
        });
      } else {
        res.status(404).json({ message: "Operator not found" });
      }
    } else {
      res.status(200).json({
        message: "No operator assignment made for this partner type",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

/*****************************************
            Send OTP 
 *****************************************/

// Function to send OTP to the partner's mobile number 
const sendOTP = async (mobileNo, otp) => {

  // Convert the number to a string for manipulation
  let contactNumberStr = mobileNo.toString();

  if (!contactNumberStr.startsWith('966')) {
    contactNumberStr = '966' + contactNumberStr.replace(/^0/, ''); // Remove leading 0 and add '966'
  }

  // Set the API URL and the token
  const apiUrl = "https://api.oursms.com";
  const apiToken = process.env.OURSMS_API_TOKEN;
  const messageBody = `Your OTP is: ${otp}`;

  const data = {
    src: "Naqlee",
    dests: [contactNumberStr],
    body: messageBody,
    priority: 0,
    delay: 0,
    validity: 0,
    maxParts: 0,
    dlr: 0,
    prevDups: 0,
    msgClass: "transactional",
  };

  try {
     const response = await axios.post(`${apiUrl}/msgs/sms`, data, {
         headers: {
           Authorization: `Bearer ${apiToken}`,
           "Content-Type": "application/json",
         },
       });
       console.log("OTP sent successfully:", response);
       if (response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, message: "Failed to send OTP" };
      }
  } catch (error) {
    console.error("Error sending OTP:", error.response.data);
    throw new Error("Failed to send OTP");
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

const editPartner = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const {
      partnerName,
      email,
      password,
      confirmPassword,
      mobileNo,
    } = req.body;

    // Password validation (if present)
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
    }

    let partnerProfile;
    if (req.file) {
      partnerProfile = {
        contentType: req.file.mimetype,
        fileName: req.file.filename,
      };
    }

    // Prepare the update object
    let updatePartner = {
      partnerName,
      email,
      mobileNo,
      partnerProfile
    };

    if (password) {
      updatePartner.password = await bcrypt.hash(password, 10);
    }

    // Remove undefined fields from the update object
    Object.keys(updatePartner).forEach((key) => {
      if (updatePartner[key] === undefined) {
        delete updatePartner[key];
      }
    });

    // Find and update the existing partner
    const editedPartner = await partner.findByIdAndUpdate(partnerId, updatePartner, {
      new: true, 
    });

    if (!editedPartner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    return res.status(200).json({ message: "Partner Profile Updated!", data: editedPartner });
  } catch (error) {
    console.error(error);  // For debugging
    return res.status(500).json({ message: "Server Error" });
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
exports.assignOperator = assignOperator;
exports.editPartner = editPartner;
