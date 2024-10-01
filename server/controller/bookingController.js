const Booking = require("../Models/BookingModel");
const updateOperatorsWithNewBooking = require("./partner/updateOperatorWithNewBooking");
const Partner = require("../Models/partner/partnerModel");
const mongoose = require("mongoose");
const User = require("../Models/userModel");
const Commission = require("../Models/commissionModel");

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
    zipCode,
  } = req.body;

  try {
    // Check if the user is suspended
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isSuspended || user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact your admin.",
      });
    }

    // Check if the user has an account type of "Single User"
    if (user.accountType === "Single User") {
      // Check if the user has any ongoing bookings
      const ongoingBooking = await Booking.findOne({
        user: user._id,
        bookingStatus: { $ne: "Completed" },
      });

      if (ongoingBooking) {
        return res.status(403).json({
          message:
            "You already have an ongoing booking. Complete your current booking before making another.",
        });
      }
    }

     // Validate that productValue is a number
     if (typeof productValue !== 'number' || isNaN(productValue)) {
      return res.status(400).json({
        message: "Validation error: productValue must be a valid number.",
      });
    }

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

    // Ensure bookingId is not null
    if (!savedBooking._id) {
      throw new Error("Booking ID is required for operator update.");
    }

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

const editBooking = async (req, res) => {
  const { bookingId } = req.params; 
  const { date, pickup, dropPoints, additionalLabour } = req.body;

  try {
    // Find the booking by bookingId
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the booking belongs to the current user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to edit this booking.",
      });
    }

    // Update only the allowed fields
    if (date) {
      booking.date = date;
    }
    if (pickup) {
      booking.pickup = pickup;
    }
    if (dropPoints) {
      booking.dropPoints = dropPoints;
    }
    if (additionalLabour) {
      booking.additionalLabour = additionalLabour;
    }

    // Save the updated booking
    const updatedBooking = await booking.save();

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({
      message: "Error updating booking",
      error: error.message,
    });
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

const deleteBooking = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { success: false, message: "Booking not found" };
    }

    if (booking.partner) {
      // Remove booking requests from operators of all other partners
      await Partner.updateMany(
        { _id: { $ne: booking.partner } },
        {
          $pull: { bookingRequest: { bookingId: booking._id } },
        }
      );
    }
    return {
      success: true,
      message: "Booking request removed from partners successfully",
    };
  } catch (error) {
    console.error("Error deleting booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete booking" });
  }
};




const updateBookingPaymentStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { amount, status, partnerId, totalAmount, oldQuotePrice } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Fetch the user associated with the booking
    const user = await User.findById(booking.user);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Fetch the commission slabs based on user's accountType
    const commission = await Commission.findOne({ userType: user.accountType }).exec();
    if (!commission || !commission.slabRates || commission.slabRates.length === 0) {
      return res.status(404).json({ success: false, message: "Commission slabs not found for user type" });
    }

    // Determine the applicable slab rate based on the oldQuotePrice
    let commissionRate = 0;
    for (const slab of commission.slabRates) {
      if (oldQuotePrice >= slab.slabRateStart && oldQuotePrice <= slab.slabRateEnd) {
        commissionRate = parseFloat(slab.commissionRate) / 100; // Convert to decimal
        console.log(`Applicable Slab Rate: ${slab.commissionRate}%`);
        console.log(`Commission Rate: ${commissionRate}`);
        break;
      }
    }

    if (commissionRate === 0) {
      return res.status(400).json({ success: false, message: "Commission rate not applicable for the given amount" });
    }

    // Calculate admin commission based on the oldQuotePrice
    const adminCommission = oldQuotePrice * commissionRate;
    console.log(`Calculated Admin Commission: ${adminCommission}`);

    // Ensure adminCommission is set only if it's not already set
    if (booking.adminCommission === undefined || booking.adminCommission === 0) {
      booking.adminCommission = adminCommission;
    }

    // Initialize remainingBalance if not already set
    if (booking.remainingBalance === undefined || booking.remainingBalance === 0) {
      booking.remainingBalance = totalAmount;
    }

    // Calculate the net amount after admin commission based on status
    let netAmount;
    if (status === "HalfPaid") {
      const halfAmount = totalAmount / 2;
      netAmount = halfAmount - adminCommission;
      booking.remainingBalance = totalAmount - halfAmount;
      booking.initialPayout = netAmount; // Store the initial payout
    } else if (status === "Completed") {
      netAmount = amount; // No need to deduct admin commission again
      booking.remainingBalance = 0;
      booking.finalPayout = booking.finalPayout + netAmount; // Store the final payout
    } else if (status === "Paid") {
      netAmount = totalAmount - adminCommission;
      booking.remainingBalance = 0;
      booking.initialPayout = netAmount / 2;
      booking.finalPayout = netAmount - booking.initialPayout;
    } else {
      netAmount = amount;
    }

    // Calculate updated amounts
    let updatedPaymentAmount = booking.paymentAmount + amount;
    let updatedRemainingBalance = booking.remainingBalance;

    if (updatedRemainingBalance < 0) {
      return res.status(400).json({ success: false, message: "Amount exceeds remaining balance" });
    }

    if (status === "Completed" || status === "Paid") {
      updatedRemainingBalance = 0;
    }

    // Update booking details
    booking.paymentAmount = updatedPaymentAmount;
    booking.paymentStatus = status;
    booking.remainingBalance = updatedRemainingBalance;
    booking.partner = partnerId;

    // Update the payout to be the sum of initial and final payouts
    if (status === "HalfPaid") {
      booking.payout = booking.initialPayout;
    } else {
      booking.payout = (booking.initialPayout || 0) + (booking.finalPayout || 0);
    }

    // Update booking status if payment status is 'HalfPaid', 'Completed', or 'Paid'
    if (status === "HalfPaid" || status === "Completed" || status === "Paid") {
      booking.bookingStatus = "Running";
    }

    // Save the updated booking
    const updatedBooking = await booking.save();

    // Find the partner by ID
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Correctly update the payment status in partner's booking requests
    partner.bookingRequest.forEach((request) => {
      if (request.bookingId.equals(booking._id)) {
        request.paymentStatus = status;
      }
    });

    // Save the updated partner
    await partner.save();

    // Optionally delete the booking if needed
    deleteBooking(bookingId);

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Booking payment status updated successfully",
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Error updating booking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking payment status"
    });
  }
};





const bookingCompleted = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({
      user: userId,
      paymentStatus: { $in: ["Completed", "HalfPaid", "Paid"] },
    });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings" });
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getBookingsById = async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const booking = await Booking.find({ user: userId });
    if (!booking.length) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getBookingsByBookingId = async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ message: "Invalid booking ID format" });
  }
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAdditionalCharges = async (req, res) => {
  const { bookingId } = req.params;
  const { additionalCharges, reason } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Ensure additionalCharges is a number
    if (typeof additionalCharges !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid additional charges amount" });
    }

    // Ensure booking.remainingBalance and booking.additionalCharges are numbers
    if (typeof booking.remainingBalance !== "number") {
      booking.remainingBalance = 0;
    }
    if (typeof booking.additionalCharges !== "number") {
      booking.additionalCharges = 0;
    }

    // Add additional charges and reason
    booking.additionalCharges += additionalCharges;
    booking.remainingBalance += additionalCharges;
    booking.paymentStatus = "HalfPaid";

    // Add reason to the additionalChargesReasons array
    booking.additionalChargesReason.push(reason);

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Additional charges added successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error adding additional charges:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add additional charges",
    });
  }
};



const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId, status } = req.body;

    // Find the booking by bookingId
    const booking = await Booking.findOne({ _id: bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Find the partner associated with this booking
    const partner = await Partner.findOne({ 'bookingRequest.bookingId': bookingId });

    if (!partner) {
      return res.status(404).json({ message: 'No bookingRequest found for this bookingId' });
    }

    console.log('Partner fetched:', partner);

    if (status === true) {
      // Update booking status to "Completed"
      booking.bookingStatus = 'Completed';
      await booking.save();

      // Find the corresponding bookingRequest
      const bookingRequest = partner.bookingRequest.find(br => br.bookingId.toString() === bookingId.toString());
      if (bookingRequest) {
        bookingRequest.bookingStatus = booking.bookingStatus;
        await partner.save(); // Save updated partner document

        // Now access the assignedOperator from the bookingRequest
        const assignedOperator = bookingRequest.assignedOperator;

        if (assignedOperator && assignedOperator.operatorId) {
          // Loop through operators to find the one that matches the assignedOperator
          let operatorFound = false;
          for (const operator of partner.operators) {
            let operatorDetail = operator.operatorsDetail.find(op => op._id.toString() === assignedOperator.operatorId.toString());
            if (operatorDetail) {
              operatorDetail.status = 'available';  // Update status to 'available'
              operatorFound = true;
              break; // Exit loop once found
            }
          }

          // Also check and update the `extraOperators` array
          let extraOperator = partner.extraOperators.find(op => op._id.toString() === assignedOperator.operatorId.toString());
          if (extraOperator) {
            extraOperator.status = 'available';  // Update status to 'available'
          } else {
            console.log(`Operator not found in extraOperators with ID: ${assignedOperator.operatorId}`);
          }

          // Save the updated status of operators
          if (operatorFound || extraOperator) {
            await partner.save(); // Save the updated partner document
          } else {
            console.log('No operator found with the assigned operator ID.');
          }
        } else {
          console.log('No assigned operator found in booking request.');
        }
      } else {
        return res.status(404).json({ message: 'No bookingRequest found for this bookingId' });
      }

      return res.status(200).json({ message: 'Booking status updated to Completed', booking });
    } else {
      return res.status(400).json({ message: 'Status is not true, cannot update booking status' });
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



module.exports = {
  createBooking,
  editBooking,
  cancelBooking,
  updateBookingPaymentStatus,
  bookingCompleted,
  getBookingsById,
  getAllBookings,
  getBookingsByBookingId,
  addAdditionalCharges,
  updateBookingStatus
};
