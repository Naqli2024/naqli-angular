const express = require("express");
const router = express.Router();
const {
  createBooking,
  editBooking,
  cancelBooking,
  updateBookingPaymentStatus,
  bookingCompleted,
  getBookingsById,
  getAllBookings,
  getBookingsByBookingId,
  addAdditionalCharges,
  updateBookingStatus,
  getBookingsWithPendingPayment,
  getUnitDetails
} = require("../controller/bookingController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/bookings", protect, createBooking);
router.put("/edit-booking/:bookingId", protect, editBooking);
router.delete("/bookings/:bookingId", protect, cancelBooking);
router.put("/bookings/:bookingId/payment", protect, updateBookingPaymentStatus);
router.get("/bookings/user/:userId/completed", protect, bookingCompleted);
router.get("/bookings/:userId", protect, getBookingsById);
router.get("/getAllBookings", getAllBookings);
router.get("/getBookingsByBookingId/:bookingId", protect, getBookingsByBookingId);
router.post("/bookings/:bookingId/additional-charges", protect, addAdditionalCharges);
router.post("/bookings/update-booking-status", protect, updateBookingStatus);
router.get("/bookings/getBookingsWithPendingPayment/:id", protect, getBookingsWithPendingPayment);
router.get('/bookings/getUnitDetails/:bookingId', getUnitDetails);

module.exports = router;
