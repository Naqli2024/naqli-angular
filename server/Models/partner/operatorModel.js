const mongoose = require("mongoose");

const operatorSchema = new mongoose.Schema(
  {
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
    panelInformation: {
      type: String,
      required: false,
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
    partnerName: {
      type: String,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Operator = mongoose.model("Operator", operatorSchema);

module.exports = Operator;
