const Partner = require("../../Models/partner/partnerModel");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require('mongoose');

// Multer setup for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destinationFolder = "uploads/";

    if (
      file.fieldname === "drivingLicense" ||
      file.fieldname === "aramcoLicense" ||
      file.fieldname === "nationalID"
    ) {
      destinationFolder += `pdf`;
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

const createExtraOperator = async (req, res) => {
  try {
    const {
      unitType,
      unitClassification,
      subClassification,
      firstName,
      lastName,
      email,
      mobileNo,
      iqamaNo,
      dateOfBirth,
      panelInformation,
      partnerName,
      partnerId,
    } = req.body;

    const { drivingLicense, aramcoLicense, nationalID } = req.files;

    // Validation for 10-digit fields
    const isValid10Digit = (value) => /^\d{10}$/.test(value);

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

    // Find the partner and add the operator reference
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Check the partner type
    if (partner.type === "singleUnit + operator") {
      if (partner.operators.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Operator already exists for this partner",
        });
      }
    } else if (partner.type === "multipleUnits") {
      // Push to extraOperators only if partner type is "multipleUnits"
      partner.extraOperators.push({
        unitType: unitType || undefined,
        unitClassification: unitClassification || undefined,
        subClassification: subClassification || undefined,
        firstName,
        lastName,
        email,
        mobileNo,
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
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid partner type for adding extra operators",
      });
    }

    partner.partnerName = partnerName;
    await partner.save();

    res.status(201).json({
      success: true,
      message: "Operator created successfully",
      operator: partner.extraOperators,
    });
  } catch (error) {
    console.error("Error creating operator:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.createExtraOperator = createExtraOperator;
exports.parseFormData = parseFormData;
