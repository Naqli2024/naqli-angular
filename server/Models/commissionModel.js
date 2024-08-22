const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema(
  {
    userType: { type: String, required: true, unique: true },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: Number.isInteger,
        message: "commissionRate must be an integer between 0 and 100",
      },
    },
    effectiveDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Commission", commissionSchema);
