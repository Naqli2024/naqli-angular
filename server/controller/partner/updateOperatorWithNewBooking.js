const partner = require("../../Models/partner/partnerModel");
const mongoose = require('mongoose');

const isSaudiMatch = (bookingLocation, partnerLocation) => {
  if (!bookingLocation || !partnerLocation) return false;
  return bookingLocation.toLowerCase().includes(partnerLocation.toLowerCase());
};

const updateOperatorsWithNewBooking = async (booking, isCanceled = false) => {
  try {
    const { type, name, pickup, cityName, address } = booking;
    const subClassification = type && type.length > 0 ? type[0].typeName : "";

    if (isCanceled) {
      // If the booking is canceled, remove it from the partner's bookingRequest
      await partner.updateMany(
        {
          "bookingRequest.bookingId": booking._id, // Find the booking in partner's bookingRequest
        },
        {
          $pull: { bookingRequest: { bookingId: booking._id } }, // Remove the booking request
        }
      );
    } else {
      // Find partners that match the booking criteria
      const partners = await partner.find({
        "operators.unitClassification": name, // Match operators by unitClassification
        $or: [
          { "operators.type": { $exists: false } },
          { "operators.type": { $size: 0 } },
          { "operators.type.typeName": subClassification },
        ],
      });

      for (const p of partners) {
        const locationMatch =
          isSaudiMatch(pickup, p.city) ||
          isSaudiMatch(cityName, p.city) ||
          isSaudiMatch(address, p.city);

        const regionMatch =
          isSaudiMatch(pickup, p.region) ||
          isSaudiMatch(cityName, p.region) ||
          isSaudiMatch(address, p.region);

        if (!locationMatch && !regionMatch) {
          continue; // Skip this partner — no city/region match
        }
        
        // Check if bookingRequest exists and is an array
        if (Array.isArray(p.bookingRequest)) {
          // Push the new booking request to the partner
          await partner.updateOne(
            { _id: p._id },
            {
              $push: {
                bookingRequest: { bookingId: booking._id, quotePrice: null },
              },
            }
          );

          // Add a notification for the new booking request
          await partner.updateOne(
            { _id: p._id },
            {
              $push: {
                notifications: {
                  messageTitle: "New Booking Request",
                  messageBody: "You have a new Booking Request.",
                },
              },
            }
          );

          // Check if the newly added bookingRequest contains a paymentStatus field
          const updatedPartner = await partner.findById(p._id);
          if (updatedPartner && Array.isArray(updatedPartner.bookingRequest)) {
            const matchingRequest = updatedPartner.bookingRequest.find(
              (request) =>
                // Convert both to ObjectId or both to string for comparison
                new mongoose.Types.ObjectId(request.bookingId).toString() === booking._id.toString() &&
                request.paymentStatus
            );

            if (matchingRequest) {
              // Add notification for the confirmed booking with paymentStatus
              await partner.updateOne(
                { _id: p._id },
                {
                  $push: {
                    notifications: {
                      messageTitle: "Booking Confirmed",
                      messageBody: `User has paid and confirmed booking with bookingId: ${matchingRequest.bookingId}`,
                    },
                  },
                }
              );
            }
          }
        } else {
          console.error(`Booking request is not an array for partner ${p._id}`);
        }
      }
    }
  } catch (error) {
    console.error("Error updating operators with new booking:", error);
  }
};

module.exports = updateOperatorsWithNewBooking;
