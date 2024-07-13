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
  const { amount, status, partnerId, totalAmount } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Initialize remainingBalance if not already set
    if (booking.remainingBalance === 0) {
      booking.remainingBalance = totalAmount; 
    }

     // Calculate admin commission and payout
     const adminCommission = amount * 0.15;
     const payout = amount * 0.85;

    // Calculate updated amounts
    let updatedPaymentAmount = booking.paymentAmount + amount;
    let updatedRemainingBalance = booking.remainingBalance - amount;

    if (updatedRemainingBalance < 0) {
      return res.status(400).json({ success: false, message: "Amount exceeds remaining balance" });
    }

    if (status === 'Completed' || status === 'Paid') {
      updatedRemainingBalance = 0;
    }

    // Update booking details
    booking.paymentAmount = updatedPaymentAmount;
    booking.paymentStatus = status;
    booking.remainingBalance = updatedRemainingBalance;
    booking.partner = partnerId;
    booking.adminCommission = (booking.adminCommission || 0) + adminCommission;
    booking.payout = (booking.payout || 0) + payout;

    // Update booking status if payment status is 'HalfPaid', 'Completed', or 'Paid'
    if (status === 'HalfPaid' || status === 'Completed' || status === 'Paid') {
      booking.bookingStatus = 'Running';
    }

    // Save the updated booking
    const updatedBooking = await booking.save();

    // Find the partner by ID
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Update the payment status in partner's booking requests
    partner.operators.forEach(operator => {
      operator.bookingRequest.forEach(request => {
        if (request.bookingId.equals(booking._id)) {
          request.paymentStatus = status;
        }
      });
    });

    // Save the updated partner
    await partner.save();

    // Optionally delete the booking if needed
    deleteBooking(bookingId);

    // Respond with success
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

    // Ensure additionalCharges is a number
    if (typeof additionalCharges !== 'number') {
      return res.status(400).json({ success: false, message: "Invalid additional charges amount" });
    }

    // Log current booking details for debugging
    console.log('Current booking details:', booking);

    // Ensure booking.remainingBalance and booking.additionalCharges are numbers
    if (typeof booking.remainingBalance !== 'number') {
      booking.remainingBalance = 0;
    }
    if (typeof booking.additionalCharges !== 'number') {
      booking.additionalCharges = 0;
    }

    // Add additional charges and reason
    booking.additionalCharges += additionalCharges;
    booking.remainingBalance += additionalCharges;
    booking.paymentStatus = 'HalfPaid';

    // Add reason to the additionalChargesReasons array
    booking.additionalChargesReason.push(reason);

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Additional charges added successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error adding additional charges:', error);
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
