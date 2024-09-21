const mongoose = require("mongoose");
const { type } = require("os");

const bookingRequestSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "booking",
    required: false,
  },
  quotePrice: {
    type: Number,
    required: false,
  },
  paymentStatus: {
    type: String,
    required: false,
  },
  assignedOperator: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: false,
    },
    unit: {
      type: String,
      required: false,
    },
    operatorName: {
      type: String,
      required: false,
    },
    operatorMobileNo: {
      type: String,
      required: false,
    },
    operatorId: {  
      type: mongoose.Schema.Types.ObjectId,
      ref: "operatorDetail",
      required: false,
    },
  },
});

const operatorDetailSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: true
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
    required: true,
  },
  drivingLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  aramcoLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  nationalID: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  status: {
    type: String,
    enum: ["available", "Not available"],
    default: "available",
  },
  mode: {
    type: String,
    enum: ["online", "offline"],
    default: "offline"
  }
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
    fileName: String,
  },
  pictureOfVehicle: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  operatorsDetail: [operatorDetailSchema],
});

// Define the possible values for unitType
const unitTypeEnum = ["vehicle", "bus", "equipment", "special", "others"];

const extraOperatorSchema = new mongoose.Schema({
  unitType: {
    type: String,
    required: false,
    enum: unitTypeEnum,
  },
  unitClassification: {
    type: String,
    required: false,
  },
  subClassification: {
    type: String,
    required: false,
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
  password: {
    type: String,
    required: true
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
    required: true,
  },
  drivingLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  aramcoLicense: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  nationalID: {
    data: { type: Buffer },
    contentType: { type: String, required: true },
    fileName: String,
  },
  status: {
    type: String,
    enum: ["available", "Not available"],
    default: "available",
  },
  mode: {
    type: String,
    enum: ["online", "offline"],
    default: "offline"
  }
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
        responseMessage: {
          type: String,
          required: false,
        },
        pictureOfTheReport: {
          data: { type: Buffer },
          contentType: { type: String, required: false },
          fileName: { type: String, required: false },
        },
        isOpen: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],
    companyDetails: [
      {
        companyName: { type: String, required: true },
        legalName: { type: String, required: true },
        phoneNumber: { type: Number, required: true },
        alternativePhoneNumber: { type: Number, required: false },
        address: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: Number, required: true },
        companyType: { type: String, required: true },
        companyIdNo: { type: Number, required: true },
      },
    ],
    bookingRequest: { type: [bookingRequestSchema], default: [] },
    extraOperators: [extraOperatorSchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to prevent duplicate booking requests
partnerSchema.pre('save', async function (next) {
  const partner = this;

  // Filter out the requests that have valid bookingId (not null)
  const validBookingRequests = partner.bookingRequest.filter(
    (br) => br.bookingId !== null
  );

  const uniqueBookingIds = new Set(
    validBookingRequests.map((br) => br.bookingId.toString())
  );

  if (uniqueBookingIds.size !== validBookingRequests.length) {
    return next(
      new Error("Duplicate booking requests are not allowed for the same partner.")
    );
  }

  next();
});

const partner = mongoose.model("partner", partnerSchema);

module.exports = partner;
