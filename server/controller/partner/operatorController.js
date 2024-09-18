const Booking = require("../../Models/BookingModel");
const Partner = require("../../Models/partner/partnerModel");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");


// Multer setup for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destinationFolder = "uploads/";

    if (
      file.fieldname === "istimaraCard" ||
      file.fieldname === "drivingLicense" ||
      file.fieldname === "aramcoLicense" ||
      file.fieldname === "nationalID"
    ) {
      destinationFolder += `pdf`;
    } else if (file.fieldname === "pictureOfVehicle") {
      destinationFolder += `images`;
    } else {
      return cb(new Error("Invalid fieldname"));
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(destinationFolder, { recursive: true });
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = file.originalname.split(".").pop();
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
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
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

    const {
      istimaraCard,
      pictureOfVehicle,
      drivingLicense,
      aramcoLicense,
      nationalID,
    } = req.files;

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
        return res
          .status(400)
          .json({
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
        drivingLicense: {
          contentType: drivingLicense[0].mimetype,
          fileName: drivingLicense[0].filename,
        },
        aramcoLicense: {
          contentType: aramcoLicense[0].mimetype,
          fileName: aramcoLicense[0].filename,
        },
        nationalID: {
          contentType: nationalID[0].mimetype,
          fileName: nationalID[0].filename,
        },
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
      istimaraCard: {
        contentType: istimaraCard[0].mimetype,
        fileName: istimaraCard[0].filename,
      },
      pictureOfVehicle: {
        contentType: pictureOfVehicle[0].mimetype,
        fileName: pictureOfVehicle[0].filename,
      },
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
          drivingLicense: {
            contentType: drivingLicense[0].mimetype,
            fileName: drivingLicense[0].filename,
          },
          aramcoLicense: {
            contentType: aramcoLicense[0].mimetype,
            fileName: aramcoLicense[0].filename,
          },
          nationalID: {
            contentType: nationalID[0].mimetype,
            fileName: nationalID[0].filename,
          },
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



const operatorLogin = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the partner that contains the operator
    const partnerData = await Partner.findOne({
      "operators.operatorsDetail.email": req.body.email
    });

    if (!partnerData) {
      return res.status(400).send({
        message: "Operator not found",
        success: false,
        data: null
      });
    }

    // Find the specific operator details
    const operator = partnerData.operators.flatMap(op => op.operatorsDetail)
      .find(opDetail => opDetail.email === req.body.email);

    if (!operator) {
      return res.status(400).send({
        message: "Operator not found",
        success: false,
        data: null
      });
    }

    // Check if the operator is blocked or suspended
    if (partnerData.isBlocked || operator.isBlocked) {
      return res.status(400).send({
        message: "Your account is blocked",
        success: false,
        data: null
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
        data: null
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { operatorId: operator._id, partnerId: partnerData._id },
      process.env.JSON_WEB_TOKEN,
      { expiresIn: "365d" }
    );

    // Return the token and operator details
    return res.status(200).send({
      message: "Logged in successfully",
      success: true,
      data: {
        token,
        operator
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).send({
      message: error.message,
      success: false,
      data: null
    });
  }
};

exports.createOperator = createOperator;
exports.parseFormData = parseFormData;
exports.operatorLogin = operatorLogin;