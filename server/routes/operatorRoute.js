const express = require("express");
const router = express.Router();
const multer = require("multer");
const operatorController = require("../controller/partner/operatorController");

// Multer setup for file uploads with disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (
        file.fieldname === "istimaraCard" ||
        file.fieldname === "drivingLicense" ||
        file.fieldname === "aramcoLicense" ||
        file.fieldname === "nationalID"
      ) {
        cb(null, "uploads/pdf");
      } else if (file.fieldname === "pictureOfVehicle") {
        cb(null, "uploads/images");
      } else {
        cb(new Error("Invalid fieldname"));
      }
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Keep original file name
    },
  });
  const upload = multer({ storage: storage });
  
  router.post(
    "/add-operator",
    upload.fields([
      { name: "istimaraCard", maxCount: 1 },
      { name: "pictureOfVehicle", maxCount: 1 },
      { name: "drivingLicense", maxCount: 1 },
      { name: "aramcoLicense", maxCount: 1 },
      { name: "nationalID", maxCount: 1 },
    ]),
    operatorController.createOperator
  );
  
  module.exports = router;