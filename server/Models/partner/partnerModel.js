const mongoose = require("mongoose");

const bookingRequestSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "booking",
    required: true,
  },
  quotePrice: {
    type: Number,
    required: false,
  },
  paymentStatus: {
    type: String,
    required: false,
  },
  bookingStatus: {
    type: String,
    required: false,
  },
});

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
  bookingRequest: [bookingRequestSchema],
});

const partnerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "enterprise",
        "multipleUnits",
        "singleUnit + operator",
        "operator",
      ],
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
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    isVerified: { type: Boolean, default: false },
    operators: [operatorSchema],
    notifications: [
      {
        messageTitle: {
          type: String,
          required: true,
        },
        messageBody: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reportRequest: [
      {
        reportMessage: {
          type: String,
          required: true,
        },
        pictureOfTheReport: {
          data: { type: Buffer },
          contentType: { type: String, required: false },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const partner = mongoose.model("partner", partnerSchema);

module.exports = partner;
