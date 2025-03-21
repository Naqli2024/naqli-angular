const Booking = require("../../Models/BookingModel");
const Partner = require("../../Models/partner/partnerModel");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const path = require("path");

// Multer setup for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let destinationFolder = path.join(__dirname, 'uploads');

      if (
        ["istimaraCard", "drivingLicense", "aramcoLicense", "nationalID"].includes(file.fieldname)
      ) {
        destinationFolder = path.join(destinationFolder, 'pdf');   
      } else if (file.fieldname === "pictureOfVehicle") {
        destinationFolder = path.join(destinationFolder, 'images');  
      } else {
        return cb(new Error("Invalid fieldname"));
      }

      // Create directory if it doesn't exist
      fs.mkdirSync(destinationFolder, { recursive: true });

      cb(null, destinationFolder);
    } catch (error) {
      console.error("Error creating directory:", error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = file.originalname.split('.').pop();
    const fileName = `${uniqueSuffix}.${extension}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Middleware to parse form data and handle file uploads
const parseFormData = (req, res, next) => {
  upload.fields([
    { name: "istimaraCard", maxCount: 1 },
    { name: "pictureOfVehicle", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "aramcoLicense", maxCount: 1 },
    { name: "nationalID", maxCount: 1 },
    { name: "partnerId" },
    { name: "partnerName" },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    } else if (err) {
      console.error("Error parsing form data:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
    next();
  });
};

const createOperator = async (req, res) => {
  try {
    const {
      unitType,
      unitClassification,
      subClassification,
      plateInformation,
      istimaraNo,
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      mobileNo,
      iqamaNo,
      dateOfBirth,
      panelInformation,
      partnerName,
      partnerId,
    } = req.body;

    const files = req.files || {};

    const istimaraCard = files.istimaraCard ? files.istimaraCard[0] : null;
    const pictureOfVehicle = files.pictureOfVehicle
      ? files.pictureOfVehicle[0]
      : null;
    const drivingLicense = files.drivingLicense
      ? files.drivingLicense[0]
      : null;
    const aramcoLicense = files.aramcoLicense ? files.aramcoLicense[0] : null; // Optional
    const nationalID = files.nationalID ? files.nationalID[0] : null;

    if (!req.body.partnerId) {
      return res.status(404).json({
        success: false,
        message: "Partner ID/Name not found",
      });
    }

    // Validation for 10-digit fields
    const isValid10Digit = (value) => /^\d{10}$/.test(value);

    if (!isValid10Digit(istimaraNo)) {
      return res
        .status(400)
        .json({ success: false, message: "istimaraNo must be 10 digits long" });
    }

    if (!isValid10Digit(mobileNo)) {
      return res
        .status(400)
        .json({ success: false, message: "mobileNo must be 10 digits long" });
    }

    if (!isValid10Digit(iqamaNo)) {
      return res
        .status(400)
        .json({ success: false, message: "iqamaNo must be 10 digits long" });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the partner and add the operator reference
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Check if partner type is "singleUnit + operator" and if an operator already exists
    if (partner.type === "singleUnit + operator") {
      if (partner.operators.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Operator already exists for this partner",
        });
      }
    }

    // Find if an operator with the same unitType, unitClassification, subClassification, plateInformation already exists
    const existingOperator = partner.operators.find(
      (operator) =>
        operator.unitType === unitType &&
        operator.unitClassification === unitClassification &&
        operator.subClassification === subClassification &&
        operator.plateInformation === plateInformation
    );

    if (existingOperator) {
      // Check if the operator details already exist
      const operatorDetailExists = existingOperator.operatorsDetail.some(
        (detail) =>
          detail.firstName === firstName &&
          detail.lastName === lastName &&
          detail.email === email
      );

      if (operatorDetailExists) {
        return res.status(400).json({
          success: false,
          message: "Operator with the same name and email already exists",
        });
      }

      // Add to the existing operator's operatorsDetail array
      existingOperator.operatorsDetail.push({
        firstName,
        lastName,
        email,
        mobileNo,
        password: hashedPassword,
        iqamaNo,
        dateOfBirth,
        panelInformation,
        drivingLicense: drivingLicense
          ? {
              contentType: drivingLicense.mimetype,
              fileName: drivingLicense.filename,
            }
          : null,
        aramcoLicense: aramcoLicense
          ? {
              contentType: aramcoLicense.mimetype,
              fileName: aramcoLicense.filename,
            }
          : null,
        nationalID: nationalID
          ? {
              contentType: nationalID.mimetype,
              fileName: nationalID.filename,
            }
          : null,
      });

      await partner.save();

      return res.status(200).json({
        success: true,
        message: "Operator details updated successfully",
        operator: existingOperator,
      });
    }

    // Find matching bookings
    const matchingBookings = await Booking.find({
      name: unitClassification,
      $or: [
        { type: { $exists: false } },
        { type: { $size: 0 } },
        { type: { $elemMatch: { typeName: subClassification } } },
      ],
    });

    // Filter bookings based on paymentStatus and remove from bookingRequest
    const filteredBookings = matchingBookings.filter(
      (booking) =>
        !["HalfPaid", "Paid", "Completed"].includes(booking.paymentStatus)
    );

    // Create a new operator
    const newOperator = {
      unitType,
      unitClassification,
      subClassification,
      plateInformation,
      istimaraNo,
      partnerName,
      partnerId,
      istimaraCard: istimaraCard
        ? {
            contentType: istimaraCard.mimetype,
            fileName: istimaraCard.filename,
          }
        : null,
      pictureOfVehicle: pictureOfVehicle
        ? {
            contentType: pictureOfVehicle.mimetype,
            fileName: pictureOfVehicle.filename,
          }
        : null,
      operatorsDetail: [
        {
          firstName,
          lastName,
          email,
          mobileNo,
          password: hashedPassword,
          iqamaNo,
          dateOfBirth,
          panelInformation,
          drivingLicense: drivingLicense
            ? {
                contentType: drivingLicense.mimetype,
                fileName: drivingLicense.filename,
              }
            : null,
          aramcoLicense: aramcoLicense
            ? {
                contentType: aramcoLicense.mimetype,
                fileName: aramcoLicense.filename,
              }
            : null,
          nationalID: nationalID
            ? {
                contentType: nationalID.mimetype,
                fileName: nationalID.filename,
              }
            : null,
        },
      ],
      bookingRequest: filteredBookings.map((booking) => ({
        bookingId: booking._id,
        quotePrice: null,
      })),
    };

    // Add operator reference to partner
    partner.operators.push(newOperator);
    partner.partnerName = req.body.partnerName;
    await partner.save();

    res.status(201).json({
      success: true,
      message: "Operator created successfully",
      operator: newOperator,
    });
  } catch (error) {
    console.error("Error creating operator:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const editOperator = async (req, res) => {
  const {
    partnerId,
    operatorId,
    firstName,
    lastName,
    email,
    password,
    mobileNo,
    iqamaNo,
    dateOfBirth,
    panelInformation,
  } = req.body;

  try {
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Check if the operator exists in `operators.operatorDetail`
    let operator = partner.operators
      .flatMap((op) => op.operatorsDetail)
      .find((op) => op._id.toString() === operatorId);

    // If not found, check in `extraOperators`
    if (!operator) {
      operator = partner.extraOperators.find(
        (op) => op._id.toString() === operatorId
      );
    }

    if (!operator) {
      return res
        .status(404)
        .json({ success: false, message: "Operator not found" });
    }

    // Update only the allowed fields
    operator.firstName = firstName || operator.firstName;
    operator.lastName = lastName || operator.lastName;
    operator.email = email || operator.email;
    operator.mobileNo = mobileNo || operator.mobileNo;
    operator.iqamaNo = iqamaNo || operator.iqamaNo;
    operator.dateOfBirth = dateOfBirth || operator.dateOfBirth;
    operator.panelInformation = panelInformation || operator.panelInformation;

    // Hash the new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      operator.password = await bcrypt.hash(password, salt);
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.drivingLicense) {
        operator.drivingLicense = {
          url: `/uploads/pdf/${req.files.drivingLicense[0].filename}`,
          name: req.files.drivingLicense[0].originalname,
          contentType: req.files.drivingLicense[0].mimetype,
        };
      }

      if (req.files.aramcoLicense) {
        operator.aramcoLicense = {
          url: `/uploads/pdf/${req.files.aramcoLicense[0].filename}`,
          name: req.files.aramcoLicense[0].originalname,
          contentType: req.files.aramcoLicense[0].mimetype,
        };
      }

      if (req.files.nationalID) {
        operator.nationalID = {
          url: `/uploads/pdf/${req.files.nationalID[0].filename}`,
          name: req.files.nationalID[0].originalname,
          contentType: req.files.nationalID[0].mimetype,
        };
      }
    }

    // Update assignedOperator in booking requests
    const updatedName = `${firstName} ${lastName}`;
    for (const booking of partner.bookingRequest) {
      if (
        booking.assignedOperator &&
        booking.assignedOperator.operatorId?.toString() ===
          operator._id.toString()
      ) {
        booking.assignedOperator.operatorName = updatedName;
        booking.assignedOperator.operatorMobileNo = mobileNo;
      }
    }

    // Save the updated partner
    await partner.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Operator updated successfully",
        operator,
      });
  } catch (error) {
    console.error("Error updating operator:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;

    // Find the partner containing the operatorId
    const partner = await Partner.findOne({
      $or: [
        { "operators.operatorsDetail._id": operatorId },
        { "extraOperators._id": operatorId }
      ]
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Operator not found."
      });
    }

    // Check if the operator is assigned to an active booking
    const isAssignedToActiveBooking = partner.bookingRequest.some(booking =>
      booking.assignedOperator &&
      booking.assignedOperator.operatorId?.toString() === operatorId &&
      booking.bookingStatus !== "Completed"
    );

    if (isAssignedToActiveBooking) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Cannot delete: Operator is assigned to an active booking."
      });
    }

    // New Condition: Check if the vehicle (unit) is still under booking
    const isVehicleUnderBooking = partner.bookingRequest.some(booking => {
      return (
        booking.assignedOperator &&
        booking.assignedOperator.unit &&
        partner.operators.some(operator =>
          operator.operatorsDetail.some(detail => detail._id.toString() === operatorId) &&
          operator.plateInformation === booking.assignedOperator.unit &&
          booking.bookingStatus !== "Completed"
        )
      );
    });

    if (isVehicleUnderBooking) {
      return res.status(409).json({
        success: false,
        data: null,
        message: "Cannot delete: The operator's vehicle is under booking. Wait until the booking is completed."
      });
    }

    // Deletion logic for operators
    partner.operators = partner.operators.filter((operator) => {
      // Remove operatorDetail with the matching ID
      operator.operatorsDetail = operator.operatorsDetail.filter(
        (detail) => detail._id.toString() !== operatorId
      );

      // If operatorsDetail becomes empty, remove the entire operators object
      return operator.operatorsDetail.length > 0;
    });

    // Deletion logic for extraOperators
    partner.extraOperators = partner.extraOperators.filter(
      (extra) => extra._id.toString() !== operatorId
    );

    await partner.save();

    return res.status(200).json({
      success: true,
      message: "Operator deleted successfully."
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Internal server error",
      error: error.message
    });
  }
};

const operatorLogin = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the partner that contains the operator or extraOperator
    const partnerData = await Partner.findOne({
      $or: [
        { "operators.operatorsDetail.email": req.body.email },
        { "extraOperators.email": req.body.email },
      ],
    });

    if (!partnerData) {
      return res.status(400).send({
        message: "Operator or Extra Operator not found",
        success: false,
        data: null,
      });
    }

    // Search for the operator within the operators array
    let operator = partnerData.operators
      .flatMap((op) => op.operatorsDetail)
      .find((opDetail) => opDetail.email === req.body.email);

    // If not found in operators, check in extraOperators
    if (!operator) {
      operator = partnerData.extraOperators.find(
        (extraOp) => extraOp.email === req.body.email
      );
    }

    if (!operator) {
      return res.status(400).send({
        message: "Operator or Extra Operator not found",
        success: false,
        data: null,
      });
    }

    // Check if the partner or operator is blocked or suspended
    if (partnerData.isBlocked || operator.isBlocked) {
      return res.status(400).send({
        message: "Your account is blocked",
        success: false,
        data: null,
      });
    }

    // Check the password
    const matchedPassword = await bcrypt.compare(
      req.body.password,
      operator.password
    );
    if (!matchedPassword) {
      return res.status(400).send({
        message: "Incorrect Password",
        success: false,
        data: null,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { operatorId: operator._id, partnerId: partnerData._id },
      process.env.JSON_WEB_TOKEN,
      { expiresIn: "1d" }
    );

    const associatedPartnerId = partnerData._id;

    // Return the token and operator details along with the associated partner ID
    return res.status(200).send({
      message: "Logged in successfully",
      success: true,
      data: {
        token,
        operator,
        associatedPartnerId,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).send({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

const updateOperatorMode = async (req, res) => {
  try {
    const { partnerId, operatorId, mode } = req.body;

    // Validate the mode value
    if (!["online", "offline"].includes(mode)) {
      return res.status(400).json({
        message: "Invalid mode value. Must be 'online' or 'offline'.",
      });
    }

    // Find the partner by partnerId
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if the operatorId belongs to an extraOperator
    const extraOperator = partner.extraOperators.find(
      (eo) => eo._id.toString() === operatorId
    );

    // Check if the operatorId belongs to an operator
    let operatorDetail = null;
    const operator = partner.operators.find((op) =>
      op.operatorsDetail.some((od) => od._id.toString() === operatorId)
    );

    // If operator is found, get the operatorDetail object
    if (operator) {
      operatorDetail = operator.operatorsDetail.find(
        (od) => od._id.toString() === operatorId
      );
    }

    // If neither extraOperator nor operatorDetail is found
    if (!extraOperator && !operatorDetail) {
      return res
        .status(404)
        .json({ message: "Operator or Extra Operator not found" });
    }

    // Update the mode if extraOperator is found
    if (extraOperator) {
      extraOperator.mode = mode;
    }

    // Update the mode if operatorDetail is found
    if (operatorDetail) {
      operatorDetail.mode = mode;
    }

    await partner.save();

    res.status(200).json({
      message: "Mode updated successfully",
      updatedOperator: extraOperator || operatorDetail,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBookingRequest = async (req, res) => {
  try {
    const { operatorId } = req.body; // Get operatorId from the request body

    // Find the partner either based on multipleUnits operatorId or check if singleUnit+operator type has the matching operator
    const partner = await Partner.findOne({
      $or: [
        { "bookingRequest.assignedOperator.operatorId": operatorId }, // For multipleUnits type
        {
          type: "singleUnit + operator",
          "operators.operatorsDetail._id": operatorId,
        }, // For singleUnit + operator type
      ],
    });

    // If no partner is found
    if (!partner) {
      return res.status(404).json({ message: "Partner or Operator not found" });
    }

    // Check if the partner has any bookingRequest
    if (!partner.bookingRequest || partner.bookingRequest.length === 0) {
      return res.status(404).json({ message: "No bookingRequest found" });
    }

    // If the partner type is "multipleUnits"
    if (partner.type === "multipleUnits") {
      // Find the bookingRequest with the assignedOperator matching the given operatorId
      const booking = partner.bookingRequest.find(
        (request) =>
          request.assignedOperator.operatorId.toString() === operatorId
      );

      // If no matching bookingRequest found
      if (!booking) {
        return res
          .status(404)
          .json({ message: "Operator not found in any booking request" });
      }

      // Check if the bookingRequest has paymentStatus and it's a valid status
      if (
        !booking.paymentStatus ||
        !["Paid", "HalfPaid", "Completed"].includes(booking.paymentStatus)
      ) {
        return res
          .status(400)
          .json({ message: "Payment status not updated! Please wait!" });
      }

      // Return the bookingRequest and assignedOperator for multipleUnits type
      return res.json({
        partnerId: partner._id,
        partnerName: partner.partnerName,
        bookingRequest: booking, // The full bookingRequest
      });
    }

    // If the partner type is "singleUnit + operator"
    if (partner.type === "singleUnit + operator") {
      // Find the operator in the operators.operatorsDetail array
      const operator = partner.operators.find((operator) =>
        operator.operatorsDetail.some(
          (detail) => detail._id.toString() === operatorId
        )
      );

      if (!operator) {
        return res
          .status(404)
          .json({ message: "Operator not found in partner details" });
      }

      // Since there's only one bookingRequest for singleUnit + operator, we access the first one
      const booking = partner.bookingRequest[0]; // Assuming there's only one bookingRequest

      // Check if the bookingRequest has paymentStatus and it's a valid status
      if (
        !booking.paymentStatus ||
        !["Paid", "HalfPaid", "Completed"].includes(booking.paymentStatus)
      ) {
        return res
          .status(400)
          .json({ message: "Payment status not updated! Please wait!" });
      }

      // Return the bookingRequest for singleUnit + operator type
      return res.json({
        partnerId: partner._id,
        partnerName: partner.partnerName,
        bookingRequest: booking, // The full bookingRequest
      });
    }

    // If the partner type is not valid
    return res.status(400).json({ message: "Invalid partner type" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.createOperator = createOperator;
exports.editOperator = editOperator;
exports.deleteOperator = deleteOperator;
exports.parseFormData = parseFormData;
exports.operatorLogin = operatorLogin;
exports.updateOperatorMode = updateOperatorMode;
exports.getBookingRequest = getBookingRequest;
