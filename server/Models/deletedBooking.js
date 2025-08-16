const mongoose = require("mongoose");

const deletedBookingSchema = new mongoose.Schema({
  originalBookingId: { type: mongoose.Schema.Types.ObjectId, required: true },
  deletedAt: { type: Date, default: Date.now },
  bookingData: { type: Object, required: true }
});

module.exports = mongoose.model("deletedBookings", deletedBookingSchema);