const mongoose = require("mongoose");

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
    isVerified: { type: Boolean, default: false },
    operators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator'
      }
    ]
  },
  {
    timestamps: true,
  }
);

const partner = mongoose.model("partner", partnerSchema);

module.exports = partner;
