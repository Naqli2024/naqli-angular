const Booking = require("../Models/BookingModel");
const updateOperatorsWithNewBooking = require("./partner/updateOperatorWithNewBooking");
const Partner = require("../Models/partner/partnerModel");

const createBooking = async (req, res) => {
  const {
    unitType,
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
    zipCode
  } = req.body;

  try {
    const booking = new Booking({
      unitType,
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

const deleteBooking = async(bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { success: false, message: "Booking not found" };
    }

    if (booking.partner) {
      // Remove booking requests from operators of all other partners
      await Partner.updateMany(
        { _id: { $ne: booking.partner } },
        { $pull: { "operators.$[].bookingRequest": { bookingId: booking._id } } }
      );
    } 
    return{ success: true, message: "Booking request removed from partners successfully" };

  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ success: false, message: "Failed to delete booking" });
  }
}

const updateBookingPaymentStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status, amount, originalAmount, remainingBalance, partnerId } = req.body;
 
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
    booking.partner = partnerId;

    // Update booking status based on payment status
    if (status === 'HalfPaid' || status === 'Completed' || status === 'Paid') {
      booking.bookingStatus = 'Running';
    }

    const updatedBooking = await booking.save();

     // Update partner's operators' booking requests
     const partner = await Partner.findById(partnerId);
     if (!partner) {
       return res
         .status(404)
         .json({ success: false, message: "Partner not found" });
     }
 
     // Update booking request in operators array
     partner.operators.forEach(operator => {
       operator.bookingRequest.forEach(request => {
         if (request.bookingId.equals(booking._id)) {
           request.paymentStatus = status; // Update payment status
         }
       });
     });
 
    await partner.save();
    deleteBooking(bookingId)

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
      paymentStatus: { $in: ["Completed", "HalfPaid"] },
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

const addAdditionalCharges = async (req, res) => {
  const { bookingId } = req.params;
  const { additionalCharges, reason } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Add additional charges and reason
    booking.additionalCharges += additionalCharges;
    booking.additionalChargesReason = reason;
    booking.remainingBalance += additionalCharges;

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Additional charges added successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add additional charges",
    });
  }
};

module.exports = {
  createBooking,
  cancelBooking,
  updateBookingPaymentStatus,
  bookingCompleted,
  getBookingsById,
  getAllBookings,
  getBookingsByBookingId,
  addAdditionalCharges
};
