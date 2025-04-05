const express = require('express');
const router = express.Router();
const { driverToTakeTrip, verifyOTP } = require('../controller/driverTripController');

// Route to generate and send OTP
router.post('/driver-to-take-trip', driverToTakeTrip);

// Route to verify OTP
router.post('/driver-verify-otp', verifyOTP);

module.exports = router;