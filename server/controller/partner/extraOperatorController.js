const Partner = require("../../Models/partner/partnerModel");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
      password,
      confirmPassword,
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

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    // Find the partner and add the operator reference
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // **Check for duplicate operator**
    const isDuplicate = partner.extraOperators.some((op) =>
      op.firstName === firstName &&
      op.lastName === lastName &&
      op.email === email &&
      op.mobileNo === mobileNo
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "Operator with the same credentials already exists",
      });
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
      const hashedPassword = await bcrypt.hash(password, 10);

      // Null check for optional files to avoid undefined errors
      const drivingLicenseFile = drivingLicense ? drivingLicense[0] : null;
      const aramcoLicenseFile = aramcoLicense ? aramcoLicense[0] : null;
      const nationalIDFile = nationalID ? nationalID[0] : null;

      if (!drivingLicenseFile || !nationalIDFile) {
        return res.status(400).json({
          success: false,
          message: "Driving license and National ID are required",
        });
      }

      // Push to extraOperators only if partner type is "multipleUnits"
      partner.extraOperators.push({
        unitType: unitType || undefined,
        unitClassification: unitClassification || undefined,
        subClassification: subClassification || undefined,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        mobileNo,
        iqamaNo,
        dateOfBirth,
        panelInformation,
        drivingLicense: {
          contentType: drivingLicenseFile.mimetype,
          fileName: drivingLicenseFile.filename,
        },
        aramcoLicense: aramcoLicenseFile
          ? {
              contentType: aramcoLicense[0].mimetype,
              fileName: aramcoLicense[0].filename,
            }
          : undefined,
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
