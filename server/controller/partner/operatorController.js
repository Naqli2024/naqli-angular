const Booking = require("../../Models/BookingModel");
const Partner = require("../../Models/partner/partnerModel");
const multer = require("multer");
const fs = require("fs");

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
      destinationFolder += `pdf/${req.body.partnerId}`;
    } else if (file.fieldname === "pictureOfVehicle") {
      destinationFolder += `images/${req.body.partnerId}`;
    } else {
      return cb(new Error("Invalid fieldname"));
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(destinationFolder, { recursive: true });
    console.log("Destination folder:", destinationFolder);
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
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
      mobileNo,
      iqamaNo,
      dateOfBirth,
      partnerName,
      partnerId
    } = req.body;

    const {
      istimaraCard,
      pictureOfVehicle,
      drivingLicense,
      aramcoLicense,
      nationalID,
    } = req.files;

    // Find the partner and add the operator reference
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
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
      firstName,
      lastName,
      email,
      mobileNo,
      iqamaNo,
      dateOfBirth,
      partnerName,
      partnerId,
      istimaraCard: {
        data: istimaraCard[0].buffer,
        contentType: istimaraCard[0].mimetype,
        path: `pdf/${partner.partnerId}/${istimaraCard[0].originalname}`,
      },
      pictureOfVehicle: {
        data: pictureOfVehicle[0].buffer,
        contentType: pictureOfVehicle[0].mimetype,
        path: `images/${partner.partnerId}/${pictureOfVehicle[0].originalname}`,
      },
      drivingLicense: {
        data: drivingLicense[0].buffer,
        contentType: drivingLicense[0].mimetype,
        path: `pdf/${partner.partnerId}/${drivingLicense[0].originalname}`,
      },
      aramcoLicense: {
        data: aramcoLicense[0].buffer,
        contentType: aramcoLicense[0].mimetype,
        path: `pdf/${partner.partnerId}/${aramcoLicense[0].originalname}`,
      },
      nationalID: {
        data: nationalID[0].buffer,
        contentType: nationalID[0].mimetype,
        path: `pdf/${partner.partnerId}/${nationalID[0].originalname}`,
      },
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

exports.createOperator = createOperator;
exports.parseFormData = parseFormData;
