const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const partner = require("./partner/partnerModel");

const bookingSchema = new mongoose.Schema({
  name: {type: String, required: true},
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
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  paymentStatus: {
    type: String,
    enum: ["pending", "halfPaid", "paid", 'completed'],
    default: "pending",
  },
  paymentAmount: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
});

bookingSchema.post('remove', async function (doc) {
  try {
    await partner.updateMany(
      { 'operators.bookingRequest': doc._id },
      { $pull: { 'operators.$.bookingRequest': doc._id } }
    );
  } catch (error) {
    console.error("Error updating operators after booking deletion:", error);
  }
});

module.exports = mongoose.model("booking", bookingSchema);
