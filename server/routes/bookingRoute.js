const express = require('express');
const router = express.Router();
const { createBooking, cancelBooking, updateBookingPaymentStatus, bookingCompleted, getBookingsById } = require('../controller/bookingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/bookings', protect, createBooking);
router.delete('/bookings/:bookingId', protect, cancelBooking);
router.put('/bookings/:bookingId/payment', protect, updateBookingPaymentStatus);
router.get('/bookings/user/:userId/completed', protect, bookingCompleted);
router.get('/bookings/:userId', protect, getBookingsById);

module.exports = router;