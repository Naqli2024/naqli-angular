const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: String,
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
  bookingId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  paymentStatus: {
    type: String,
    enum: ["pending", "halfPaid", "paid", 'completed'],
    default: "pending",
  },
  paymentAmount: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
});

module.exports = mongoose.model("booking", bookingSchema);
