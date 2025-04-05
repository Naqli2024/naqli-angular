// controller/driverTripController.js
const axios = require('axios');
const Booking = require('../Models/BookingModel');
const User = require('../Models/userModel');
const DriverTrip = require('../Models/driverOtpModel');
require('dotenv').config();

// Send OTP function (uses oursms API)
const sendOTP = async (contactNumber, otp) => {
  let contactNumberStr = contactNumber.toString().replace(/^\+/, '');
  if (!contactNumberStr.startsWith('966')) {
    contactNumberStr = '966' + contactNumberStr.replace(/^0/, '');
  }

  const apiUrl = 'https://api.oursms.com';
  const apiToken = process.env.OURSMS_API_TOKEN;
  const messageBody = `Your OTP is: ${otp}`;

  const data = {
    src: 'Naqlee',
    dests: [contactNumberStr],
    body: messageBody,
    priority: 0,
    delay: 0,
    validity: 0,
    maxParts: 0,
    dlr: 0,
    prevDups: 0,
    msgClass: 'transactional',
  };

  try {
    const response = await axios.post(`${apiUrl}/msgs/sms`, data, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data ? { success: true, data: response.data } : { success: false, message: 'Failed to send OTP' };
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

// Controller for driver to take trip (generate and send OTP)
const driverToTakeTrip = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) return res.status(400).json({ message: 'Booking ID is required.' });

  try {
    const booking = await Booking.findById({ _id: bookingId });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const user = await User.findOne({ _id: booking.user });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes expiry

    // Save OTP to driverTrip collection
    await DriverTrip.create({ bookingId, resetOTP: otp, otpExpiry });

    // Send OTP
    const result = await sendOTP(user.contactNumber, otp);
    return res.status(200).json({ message: 'OTP sent successfully', otp: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Controller to verify OTP
const verifyOTP = async (req, res) => {
  const { bookingId, otp } = req.body;

  if (!bookingId || !otp) return res.status(400).json({ message: 'Booking ID and OTP are required.' });

  try {
    const trip = await DriverTrip.findOne({ bookingId });
    if (!trip) return res.status(404).json({ message: 'Trip record not found.' });

    const isExpired = new Date() > new Date(trip.otpExpiry);
    if (isExpired) return res.status(400).json({ message: 'OTP has expired.' });

    if (trip.resetOTP !== otp) return res.status(400).json({ message: 'Invalid OTP.' });

    trip.isVerified = true;
    await trip.save();

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { driverToTakeTrip, verifyOTP };
