const mongoose = require('mongoose');

const verifyUserTrip = new mongoose.Schema({
    bookingId: {type: String, required: true},
    resetOTP: {
        type: String,
        required: false,
      },
      otpExpiry: {
        type: Date,
        required: false,
      },
      isVerified: { type: Boolean, default: false }
},{timestamps: true})

const driverTrip = mongoose.model('driverTrip', verifyUserTrip);
module.exports = driverTrip;