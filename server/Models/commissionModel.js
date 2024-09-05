const mongoose = require("mongoose");

const slabSchema = new mongoose.Schema({
  slabRateStart: {
    type: Number,
    required: true,
  },
  slabRateEnd: {
    type: Number,
    required: true,
  },
  commissionRate: {
    type: String,
    required: true,
  },
});

const commissionSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["Single User", "Super User", "Enterprise User"],
      required: true,
    },
    slabRates: [slabSchema],
  },
  { timestamps: true }
);

const Commission = mongoose.model("commission", commissionSchema);

module.exports = Commission;
