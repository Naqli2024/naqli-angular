const Booking = require("../Models/BookingModel");
const updateOperatorsWithNewBooking = require("./partner/updateOperatorWithNewBooking");

const createBooking = async (req, res) => {
  const {
    name,
    type,
    image,
    pickup,
    dropPoints,
    productValue,
    date,
    time,
    additionalLabour,
    fromTime,
    toTime,
    cityName,
    address,
    zipCode,
  } = req.body;

  try {
    const booking = new Booking({
      name,
      type,
      image,
      pickup,
      dropPoints,
      productValue,
      date,
      time,
      additionalLabour,
      fromTime,
      toTime,
      cityName,
      address,
      zipCode,
      user: req.user._id,
    });

    const validationError = booking.validateSync();
    if (validationError) {
      console.error("Validation error:", validationError);
      return res
        .status(400)
        .json({ message: "Validation error", error: validationError });
    }

    const savedBooking = await booking.save();

     // Update operators with this new booking
     await updateOperatorsWithNewBooking(savedBooking, false);

    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Error saving booking:", error);
    res
      .status(500)
      .json({ message: "Error saving booking", error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update operators to remove canceled booking from bookingRequest
      await updateOperatorsWithNewBooking(deletedBooking, true);

    res.status(200).json({ success: true, message: "Booking Cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const updateBookingPaymentStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status, amount, originalAmount, remainingBalance } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Update payment status and amount
    booking.paymentAmount = amount;
    booking.paymentStatus = status;
    booking.originalAmount = originalAmount;
    booking.remainingBalance = remainingBalance;

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking payment status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking payment status",
    });
  }
};

const bookingCompleted = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({
      user: userId,
      paymentStatus: { $in: ["completed", "halfPaid"] },
    });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

const getBookingsById = async (req, res) => {
  const { userId } = req.params;
  try {
    const booking = await Booking.find({ user: userId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getBookingsByBookingId = async(req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.find({ _id: bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const getAllBookings = async(req,res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createBooking,
  cancelBooking,
  updateBookingPaymentStatus,
  bookingCompleted,
  getBookingsById,
  getAllBookings,
  getBookingsByBookingId
};
