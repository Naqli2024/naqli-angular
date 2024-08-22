const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const partner = require("./partner/partnerModel");

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unitType: String,
    type: [
      {
        typeName: String,
        scale: String,
        typeImage: String,
        typeOfLoad: String,
      },
    ],
    image: String,
    pickup: String,
    dropPoints: [String],
    productValue: Number,
    date: String,
    time: String,
    additionalLabour: Number,
    fromTime: String,
    toTime: String,
    cityName: { type: String },
    address: { type: String },
    zipCode: { type: String },
    bookingId: { type: String, unique: true, default: uuidv4 },
    bookingStatus: {
      type: String,
      enum: ["Yet to start", "Running", "Completed"],
      default: "Yet to start",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "HalfPaid", "Paid", "Completed"],
      default: "Pending",
    },
    paymentAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    additionalChargesReason: [{ type: String }],
    adminCommission: { type: Number, deafult: 0 },
    payout: { type: Number, default: 0 },
    initialPayout: { type: Number, default: 0 },
    finalPayout: { type: Number, default: 0 },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.post("remove", async function (doc) {
  try {
    if (doc.partner) {
      // Remove booking requests from operators of the associated partner
      await partner.updateOne(
        { _id: doc.partner },
        { $pull: { "operators.$[].bookingRequest": { bookingId: doc._id } } }
      );

      // Remove booking requests from operators of all other partners
      await partner.updateMany(
        { _id: { $ne: doc.partner } },
        { $pull: { "operators.$[].bookingRequest": { bookingId: doc._id } } }
      );
    }
  } catch (error) {
    console.error("Error updating operators after booking deletion:", error);
  }
});

module.exports = mongoose.model("booking", bookingSchema);
