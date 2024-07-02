const partner = require("../../Models/partner/partnerModel");

const updateOperatorsWithNewBooking = async (booking, isCanceled=false) => {
  try {
    const { type, name } = booking;

    // Loop through each type in the booking
    for (const t of type) {
      const { typeName } = t;

      if (isCanceled) {
        // Find operators that match the booking criteria
        await partner.updateMany(
            {
                'operators.bookingRequest': booking._id,
              },
              {
                $pull: { 'operators.$.bookingRequest': booking._id },
              }
        );
      } else {
        // If the booking is canceled, remove it from operators' bookingRequest
        await partner.updateMany(
            {
                'operators.unitClassification': name,
                'operators.subClassification': typeName,
              },
              {
                $push: { 'operators.$.bookingRequest': booking },
              }
        );
      }
    }
  } catch (error) {
    console.error("Error updating operators with new booking:", error);
  }
};

module.exports = updateOperatorsWithNewBooking;
