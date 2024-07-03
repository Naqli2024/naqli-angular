const partner = require("../../Models/partner/partnerModel");

const updateOperatorsWithNewBooking = async (booking, isCanceled=false) => {
  try {
    const { type, name } = booking;
    const subClassification = type && type.length > 0 ? type[0].typeName : "";

    if (isCanceled) {
      // If the booking is canceled, remove it from operators' bookingRequest
      await partner.updateMany(
        {
          'operators.bookingRequest.bookingId': booking._id,
        },
        {
          $pull: { 'operators.$[operator].bookingRequest': { bookingId: booking._id } },
        },
        {
          arrayFilters: [{ 'operator.bookingRequest.bookingId': booking._id }],
          multi: true,
        }
      );
    } else {
      // Find operators that match the booking criteria and add the new booking to bookingRequest
      await partner.updateMany(
        {
          'operators.unitClassification': name,
          $or: [
            { 'operators.type': { $exists: false } },
            { 'operators.type': { $size: 0 } },
            { 'operators.type.typeName': subClassification }
          ]
        },
        {
          $push: { 'operators.$[operator].bookingRequest': { bookingId: booking._id, quotePrice: null } },
        },
        {
          arrayFilters: [{ 'operator.unitClassification': name }],
          multi: true,
        }
      );
    }
  } catch (error) {
    console.error("Error updating operators with new booking:", error);
  }
};

module.exports = updateOperatorsWithNewBooking;
