const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: Number,
      required: true,
    },
    alternateNumber: {
      type: Number,
      required: false,
    },
    address1: {
      type: String,
      required: true,
    },
    address2: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      required: true,
    },
    govtId: {
      type: String,
      required: true,
    },
    idNumber: {
      type: Number,
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
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const user = mongoose.model("users", userSchema);

module.exports = user;
