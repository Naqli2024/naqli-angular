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
          $pull: { bookingRequest: { bookingId: booking._id } }, // Remove the booking request
        }
      );
    } else {
      // Find partners that match the booking criteria
      const partners = await partner.find({
        'operators.unitClassification': name, // Match operators by unitClassification
        $or: [
          { 'operators.type': { $exists: false } },
          { 'operators.type': { $size: 0 } },
          { 'operators.type.typeName': subClassification },
        ],
      });

      for (const p of partners) {
        // If partner's type is 'singleUnit + operator', check for existing bookingRequest
        if (p.type === 'singleUnit + operator') {
          const hasActiveBookingRequest = p.bookingRequest.some(
            (request) => request.bookingStatus !== 'Completed'
          );

          // If there is already an active bookingRequest, skip this partner
          if (hasActiveBookingRequest) {
            console.log(`Partner ${p._id} already has an active bookingRequest`);
            continue; // Skip to the next partner
          }
        }

        // Push the new booking request to the partner
        await partner.updateOne(
          { _id: p._id },
          { $push: { bookingRequest: { bookingId: booking._id, quotePrice: null } } }
        );
      }
    }
  } catch (error) {
    console.error('Error updating operators with new booking:', error);
  }
};

module.exports = updateOperatorsWithNewBooking;
