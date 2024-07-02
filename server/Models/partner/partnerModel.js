const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema({
  unitType: {
    type: String,
    required: true,
    enum: ["vehicle", "bus", "equipment", "special", "others"],
  },
  unitClassification: {
    type: String,
    required: true,
  },
  subClassification: {
    type: String,
    required: false,
  },
  plateInformation: {
    type: String,
    required: true,
  },
  istimaraNo: {
    type: String,
    required: true,
  },
  istimaraCard: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
  },
  pictureOfVehicle: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  iqamaNo: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  drivingLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
  },
  aramcoLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
  },
  nationalID: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
  },
  bookingRequest: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
    },
  ],
});

const partnerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["enterprise", "multipleUnits", "singleUnit + operator", "operator"],
    },
    partnerName: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetOTP: {
      type: String,
      required: false,
    },
    otpExpiry: {
      type: Date,
      required: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    quotePrices: [
      {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "booking" },
        quotePrice: { type: Number },
      },
    ],
    isVerified: { type: Boolean, default: false },
    operators: [operatorSchema],
  },
  {
    timestamps: true,
  }
);

const partner = mongoose.model("partner", partnerSchema);

module.exports = partner;
