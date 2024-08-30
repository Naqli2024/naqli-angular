const partner = require("../../Models/partner/partnerModel");

const updateOperatorsWithNewBooking = async (booking, isCanceled = false) => {
  try {
    const { type, name } = booking;
    const subClassification = type && type.length > 0 ? type[0].typeName : "";

    if (isCanceled) {
      // If the booking is canceled, remove it from the partner's bookingRequest
      await partner.updateMany(
        {
          'bookingRequest.bookingId': booking._id, // Find the booking in partner's bookingRequest
        },
        {
          $pull: { 'bookingRequest': { bookingId: booking._id } }, // Remove the booking request
        }
      );
    } else {
      // Find partners that match the booking criteria and add the new booking to bookingRequest
      await partner.updateMany(
        {
          'operators.unitClassification': name, // Match operators by unitClassification
          $or: [
            { 'operators.type': { $exists: false } },
            { 'operators.type': { $size: 0 } },
            { 'operators.type.typeName': subClassification }
          ]
        },
        {
          $push: { 'bookingRequest': { bookingId: booking._id, quotePrice: null } }, // Add booking request at partner level
        }
      );
    }
  } catch (error) {
    console.error("Error updating operators with new booking:", error);
  }
};

module.exports = updateOperatorsWithNewBooking;
