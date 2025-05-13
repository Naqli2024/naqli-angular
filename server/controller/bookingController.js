const Booking = require("../Models/BookingModel");
const updateOperatorsWithNewBooking = require("./partner/updateOperatorWithNewBooking");
const Partner = require("../Models/partner/partnerModel");
const mongoose = require("mongoose");
const User = require("../Models/userModel");
const Commission = require("../Models/commissionModel");
const convertAndValidateTime = require("../middlewares/convertAndValidateTime");

const isSaudiLocation = (location) =>
  typeof location === "string" &&
  location.toLowerCase().includes("saudi arabia");

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
    fromTime,
    additionalLabour,
    toTime,
    cityName,
    address,
    zipCode,
  } = req.body;

  try {
    // Validate Saudi Arabia-only locations
    if (pickup && !isSaudiLocation(pickup)) {
      return res
        .status(400)
        .json({ message: "Please select a pickup location within Saudi Arabia." });
    }

    if (cityName && !isSaudiLocation(cityName)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid city within Saudi Arabia." });
    }

    if (address && !isSaudiLocation(address)) {
      return res
        .status(400)
        .json({ message: "Please enter an address located in Saudi Arabia." });
    }

    if (Array.isArray(dropPoints)) {
      for (let point of dropPoints) {
        if (point && !isSaudiLocation(point)) {
          return res
            .status(400)
            .json({ message: "All drop points must be located within Saudi Arabia." });
        }
      }
    }

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
      const ongoingBooking = await Booking.findOne({
        user: user._id,
        bookingStatus: { $ne: "Completed" },
      });

      if (ongoingBooking) {
        return res.status(403).json({
          message: "You already have an ongoing booking.",
        });
      }
    }

    if (user.accountType === "Super User") {
      const bookings = await Booking.find({ user: user._id });

      const activeBookings = bookings.filter(
        (bookings) => bookings.bookingStatus !== "Completed"
      );

      if (activeBookings.length >= 25) {
        return res.status(403).json({
          message:
            "Booking limit reached. Complete existing bookings before creating a new one.",
        });
      }
    }

    // Prevent past dates from being booked
    const currentDate = new Date();
    const bookingDate = new Date(date);
    if (bookingDate.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        message: "Booking date cannot be in the past.",
      });
    }

    // Condition 1: Check if pickup and dropPoints are the same
    if (
      Array.isArray(dropPoints) &&
      dropPoints.length > 0 &&
      dropPoints[0] === pickup
    ) {
      return res.status(400).json({
        message: "Pickup and dropPoint locations should be different.",
      });
    }

    // Time validation
    let bookingTime;
    let fromTimeParsed;
    let toTimeParsed;

    // Check if 'time' is provided
    if (time) {
      try {
        bookingTime = convertAndValidateTime(time, date);
        // console.log(`Constructed booking date-time: ${bookingTime}`);
      } catch (conversionError) {
        return res.status(400).json({
          message: conversionError.message, // Invalid time format or booking time
        });
      }
    }

    // If 'fromTime' and 'toTime' are provided, validate them
    if (fromTime && toTime) {
      try {
        fromTimeParsed = convertAndValidateTime(fromTime, date);
      } catch (conversionError) {
        return res.status(400).json({
          message: conversionError.message, // Invalid fromTime or toTime format
        });
      }
    } else if (!time && !fromTime && !toTime) {
      return res.status(400).json({
        message:
          "At least one time field (time, fromTime, toTime) must be provided.",
      });
    }

    // Continue creating the booking
    const booking = new Booking({
      unitType,
      name,
      type,
      image,
      pickup,
      dropPoints,
      productValue,
      date,
      time: time || null, // Assign null if time is not provided
      fromTime: fromTime || null, // Assign null if fromTime is not provided
      additionalLabour,
      toTime: toTime || null, // Assign null if toTime is not provided
      cityName,
      address,
      zipCode,
      user: req.user._id,
    });

    const validationError = booking.validateSync();
    if (validationError) {
      return res
        .status(400)
        .json({ message: "Validation error", error: validationError });
    }

    const savedBooking = await booking.save();

    if (!savedBooking._id) {
      throw new Error("Booking ID is required for operator update.");
    }

    await updateOperatorsWithNewBooking(savedBooking, false);

    res.status(201).json(savedBooking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving booking", error: error.message });
  }
};

const editBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { date, pickup, dropPoints, additionalLabour, cityName, address } =
    req.body;

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
    if (cityName) {
      booking.cityName = cityName;
    }
    if (address) {
      booking.address = address;
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
    // Try to find and delete the booking by bookingId
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Now, proceed to find the partner associated with this booking
    const partner = await Partner.findOne({
      "bookingRequest.bookingId": bookingId,
    });

    if (!partner) {
      return res
        .status(404)
        .json({ message: "No partner associated with this bookingId" });
    }

    // Find the bookingRequest to get the assigned operator
    const bookingRequest = partner.bookingRequest.find(
      (br) => br.bookingId.toString() === bookingId.toString()
    );

    if (
      bookingRequest &&
      bookingRequest.assignedOperator &&
      bookingRequest.assignedOperator.operatorId
    ) {
      const assignedOperator = bookingRequest.assignedOperator;

      // If the assigned operator's bookingId matches the deleted bookingId, update the status
      if (bookingRequest.bookingId.toString() === bookingId.toString()) {
        // Update status for the operator in `operatorsDetail`
        let operatorFound = false;
        for (const operator of partner.operators) {
          let operatorDetail = operator.operatorsDetail.find(
            (op) => op._id.toString() === assignedOperator.operatorId.toString()
          );
          if (operatorDetail) {
            operatorDetail.status = "available"; // Set status to 'available'
            operatorFound = true;
            break;
          }
        }

        // Check and update status in `extraOperators`
        let extraOperator = partner.extraOperators.find(
          (op) => op._id.toString() === assignedOperator.operatorId.toString()
        );
        if (extraOperator) {
          extraOperator.status = "available"; // Set status to 'available'
        }

        // Save the updated operator status if any were found and updated
        if (operatorFound || extraOperator) {
          await partner.save(); // Save updated operator status in the partner document
        } else {
          console.log("No operator found with the assigned operator ID.");
        }
      } else {
        console.log("Assigned operator does not match this bookingId.");
      }
    } else {
      console.log("No assigned operator found in booking request.");
    }

    // If the booking was found and deleted, update operators to remove the canceled booking
    await updateOperatorsWithNewBooking(deletedBooking, true);

    // Successfully canceled the booking
    res.status(200).json({ success: true, message: "Booking Cancelled" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel booking", error });
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
  let { amount, status, partnerId, totalAmount, oldQuotePrice } = req.body;

  // Round `amount` up to the nearest whole number if it has decimals
  amount = Math.round(amount);

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Fetch the user associated with the booking
    const user = await User.findById(booking.user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Fetch the commission slabs based on user's accountType
    const commission = await Commission.findOne({
      userType: user.accountType,
    }).exec();
    if (
      !commission ||
      !commission.slabRates ||
      commission.slabRates.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Commission slabs not found for user type",
      });
    }

    // Determine the applicable slab rate based on the oldQuotePrice
    let commissionRate = 0;
    for (const slab of commission.slabRates) {
      if (
        oldQuotePrice >= slab.slabRateStart &&
        oldQuotePrice <= slab.slabRateEnd
      ) {
        commissionRate = parseFloat(slab.commissionRate) / 100; // Convert to decimal
        break;
      }
    }

    if (commissionRate === 0) {
      return res.status(400).json({
        success: false,
        message: "Commission rate not applicable for the given amount",
      });
    }

    // Calculate admin commission based on the oldQuotePrice
    const adminCommission = oldQuotePrice * commissionRate;

    // Ensure adminCommission is set only if it's not already set
    if (
      booking.adminCommission === undefined ||
      booking.adminCommission === 0
    ) {
      booking.adminCommission = adminCommission;
    }

    // Initialize remainingBalance if not already set
    if (
      booking.remainingBalance === undefined ||
      booking.remainingBalance === 0
    ) {
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
      return res
        .status(400)
        .json({ success: false, message: "Amount exceeds remaining balance" });
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
      booking.payout =
        (booking.initialPayout || 0) + (booking.finalPayout || 0);
    }

    // Update booking status if payment status is 'HalfPaid', 'Completed', or 'Paid'
    if (status === "HalfPaid" || status === "Completed" || status === "Paid") {
      booking.bookingStatus = "Running";
    }

    if (booking.tripStatus === "Completed" && booking.remainingBalance === 0) {
      booking.bookingStatus = "Completed";

      // Call the function to generate and save the invoice ID when the booking status is completed
      const invoiceId = await generateInvoiceId(booking._id);
    }

    // Save the updated booking
    const updatedBooking = await booking.save();

    // Find the partner by ID
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
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

const generateInvoiceId = async (bookingId) => {
  // Get the current date in YYYYMMDD format
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

  // Generate a 6-character alphanumeric random string
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uniquePart = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniquePart += characters[randomIndex];
  }

  // Combine the prefix, date, and unique part to form the invoice ID
  const invoiceId = `INV-${dateStr}-${uniquePart}`;

  // Assuming your Booking model has an 'invoiceId' field
  const booking = await Booking.findById(bookingId);
  if (booking) {
    // Store the generated invoice ID in the booking document
    booking.invoiceId = invoiceId;
    await booking.save();
  }

  return invoiceId;
};

const bookingCompleted = async (req, res) => {
  const { userId } = req.params;

  try {
    const bookings = await Booking.find({
      user: userId,
      paymentStatus: { $in: ["Completed", "HalfPaid", "Paid"] },
    }).sort({ createdAt: -1 });
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
    const booking = await Booking.find({ user: userId }).sort({
      createdAt: -1,
    });
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
    const booking = await Booking.findById(bookingId).sort({ createdAt: -1 });
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
    const bookings = await Booking.find().sort({ createdAt: -1 });
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
    const booking = await Booking.findById(bookingId).sort({ createdAt: -1 });
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

    // Try to find the booking in the Booking collection
    const booking = await Booking.findOne({ _id: bookingId });

    // If the booking is not found, update the operator status based on the bookingRequest in the Partner
    const partner = await Partner.findOne({
      "bookingRequest.bookingId": bookingId,
    });

    if (!partner) {
      return res
        .status(404)
        .json({ message: "No partner found for this bookingId" });
    }

    const bookingRequest = partner.bookingRequest.find(
      (br) => br.bookingId.toString() === bookingId.toString()
    );

    if (!booking) {
      // If booking not found, check if there is an assignedOperator in the bookingRequest
      if (
        bookingRequest &&
        bookingRequest.assignedOperator &&
        bookingRequest.assignedOperator.operatorId
      ) {
        const assignedOperator = bookingRequest.assignedOperator;

        // Update status for operator in `operatorsDetail`
        let operatorFound = false;
        for (const operator of partner.operators) {
          let operatorDetail = operator.operatorsDetail.find(
            (op) => op._id.toString() === assignedOperator.operatorId.toString()
          );
          if (operatorDetail) {
            operatorDetail.status = "available"; // Update status to 'available'
            operatorFound = true;
            break;
          }
        }

        // Check and update status in `extraOperators`
        let extraOperator = partner.extraOperators.find(
          (op) => op._id.toString() === assignedOperator.operatorId.toString()
        );
        if (extraOperator) {
          extraOperator.status = "available"; // Update status to 'available'
        }

        // Save the updated partner document if any operator was found and updated
        if (operatorFound || extraOperator) {
          await partner.save(); // Save the updated operator status
          return res.status(200).json({
            message: "Booking not found, operator status updated to available",
            operatorStatusUpdated: true,
          });
        } else {
          return res.status(404).json({
            message:
              "Assigned operator not found in operators or extraOperators",
          });
        }
      } else {
        return res
          .status(404)
          .json({ message: "No assignedOperator found in bookingRequest" });
      }
    }

    // If booking exists, proceed to update status if requested
    if (status === true) {
      // Update booking status to "Completed"
      booking.tripStatus = "Completed";
      if (
        booking.tripStatus === "Completed" &&
        booking.remainingBalance === 0
      ) {
        booking.bookingStatus = "Completed";

        // Call the function to generate and save the invoice ID when the booking status is completed
        const invoiceId = await generateInvoiceId(booking._id);
      }
      await booking.save();

      if (bookingRequest) {
        bookingRequest.bookingStatus = booking.bookingStatus;
        await partner.save(); // Save updated bookingRequest status in partner

        const assignedOperator = bookingRequest.assignedOperator;

        if (assignedOperator && assignedOperator.operatorId) {
          // Update operator status in `operatorsDetail`
          let operatorFound = false;
          for (const operator of partner.operators) {
            let operatorDetail = operator.operatorsDetail.find(
              (op) =>
                op._id.toString() === assignedOperator.operatorId.toString()
            );
            if (operatorDetail) {
              operatorDetail.status = "available"; // Set status to 'available'
              operatorFound = true;
              break;
            }
          }

          // Update operator status in `extraOperators`
          let extraOperator = partner.extraOperators.find(
            (op) => op._id.toString() === assignedOperator.operatorId.toString()
          );
          if (extraOperator) {
            extraOperator.status = "available";
          }

          // Save the updated status if any operator was updated
          if (operatorFound || extraOperator) {
            await partner.save(); // Save updated operator status
          } else {
            console.log("No operator found with the assigned operator ID.");
          }
        }
      }

      return res
        .status(200)
        .json({ message: "Booking status updated to Completed", booking });
    } else {
      return res
        .status(400)
        .json({ message: "Status is not true, cannot update booking status" });
    }
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getBookingsWithPendingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;

    // Find the user by ID in the User collection
    const user = await User.findById(id);

    if (!user) {
      // If user is not found, throw an error
      return res.status(404).json({ message: "User not found. Please login" });
    }

    // Find all bookings associated with the user where paymentStatus is 'NotPaid'
    const pendingBookings = await Booking.find({
      user: user._id,
      paymentStatus: "NotPaid",
    })
      .skip((page - 1) * 1) // Skip results for pagination, limit set to 1
      .limit(1); // Limit to 1 result

    // If no pending bookings are found
    if (!pendingBookings || pendingBookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No more pending bookings found" });
    }

    // Return the filtered bookings (1 result at a time)
    return res.status(200).json({
      message: "Pending booking found",
      booking: pendingBookings[0], // Since we're limiting to 1, take the first (and only) booking
      currentPage: page, // current page number for reference
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const getUnitDetails = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const bookingDetails = await Booking.findOne({ _id: bookingId });

    if (!bookingDetails) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!bookingDetails.partner) {
      // If the booking is not paid, return a message without erroring out
      if (bookingDetails.paymentStatus === "NotPaid") {
        return res.status(200).json({
          message:
            "Payment is not updated. Partner not found, unit details cannot be fetched.",
        });
      } else {
        return res
          .status(400)
          .json({ message: "Payment is not updated. Partner not found" });
      }
    }

    const partner = await Partner.findById(bookingDetails.partner);

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    let unitInfo;

    // Handle "multipleUnits"
    if (partner.type === "multipleUnits") {
      const bookingRequest = partner.bookingRequest.find(
        (request) => request.bookingId.toString() === bookingId
      );

      if (bookingRequest && bookingRequest.assignedOperator) {
        unitInfo = {
          unit: bookingRequest.assignedOperator.unit,
        };
      } else {
        return res
          .status(404)
          .json({ message: "Assigned operator not found for this booking" });
      }
    }

    // Handle "singleUnit + operator"
    else if (partner.type === "singleUnit + operator") {
      const unitDetails = partner.operators[0];
      unitInfo = {
        unit: unitDetails.plateInformation,
      };
    }

    // Unknown partner type
    else {
      return res.status(400).json({ message: "Unknown partner type" });
    }

    // Return the collected unit info
    return res.status(200).json({
      unit: unitInfo.unit,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};

const updateBookingForPaymentBrand = async (req, res) => {
  const { bookingId, brand } = req.body;

  try {
    // Find the booking by ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Update the paymentType field with the brand
    booking.paymentType = brand;

    // Save the updated booking
    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking payment type updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking payment type:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking payment type",
    });
  }
};

const getBookingsWithInvoice = async (req, res) => {
  try {
    // Query the bookings collection for bookings that have an invoiceId field
    const bookingsWithInvoice = await Booking.find({
      invoiceId: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    if (bookingsWithInvoice.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found with an invoiceId.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bookings with invoiceId fetched successfully.",
      bookings: bookingsWithInvoice,
    });
  } catch (error) {
    console.error("Error fetching bookings with invoiceId:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings with invoiceId.",
    });
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
  updateBookingStatus,
  getBookingsWithPendingPayment,
  getUnitDetails,
  updateBookingForPaymentBrand,
  getBookingsWithInvoice,
};
