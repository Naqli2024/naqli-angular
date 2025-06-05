const partner = require("../../Models/partner/partnerModel");
const mongoose = require("mongoose");
const { normalizeCityOrRegion } = require("../normalizeCityOrRegion");
const Booking = require("../../Models/BookingModel");

const isSaudiMatch = (input, target) => {
  if (!input || !target) return false;

  const inputValues = Array.isArray(input) ? input : [input];
  const targetValues = Array.isArray(target) ? target : [target];

  return inputValues.some((inputVal) =>
    targetValues.some((targetVal) =>
      inputVal.toLowerCase().includes(targetVal.toLowerCase()) ||
      targetVal.toLowerCase().includes(inputVal.toLowerCase())
    )
  );
};

const updateOperatorsWithNewBooking = async (booking, isCanceled = false) => {
  try {
    const { type, name, pickup, cityName, address, unitType } = booking;
    const subClassification = type && type.length > 0 ? type[0].typeName : "";

    if (isCanceled) {
      await partner.updateMany(
        { "bookingRequest.bookingId": booking._id },
        { $pull: { bookingRequest: { bookingId: booking._id } } }
      );
      return;
    }

    const normalizedPickup = normalizeCityOrRegion(pickup);
    const normalizedCityName = normalizeCityOrRegion(cityName);
    const normalizedAddress = normalizeCityOrRegion(address);

    let partners = [];

    if (unitType === "shared-cargo") {
      partners = await partner.find({});
    } else {
      partners = await partner.find({
        "operators.unitClassification": new RegExp(`^${name}$`, "i"),
        $or: [
          { "operators.type": { $exists: false } },
          { "operators.type": { $size: 0 } },
          { "operators.type.typeName": new RegExp(`^${subClassification}$`, "i") },
        ],
      });
    }

    for (const p of partners) {
      const normalizedPartnerCity = normalizeCityOrRegion(p.city);
      const normalizedPartnerRegion = normalizeCityOrRegion(p.region);

      const locationMatch =
        isSaudiMatch(normalizedPickup, normalizedPartnerCity) ||
        isSaudiMatch(normalizedCityName, normalizedPartnerCity) ||
        isSaudiMatch(normalizedAddress, normalizedPartnerCity);

      const regionMatch =
        isSaudiMatch(normalizedPickup, normalizedPartnerRegion) ||
        isSaudiMatch(normalizedCityName, normalizedPartnerRegion) ||
        isSaudiMatch(normalizedAddress, normalizedPartnerRegion);

      const match = locationMatch || regionMatch;
      if (!match) continue;

      // Restriction for "singleUnit + operator"
      if (p.type === "singleUnit + operator") {
        let hasActiveBooking = false;

        for (const req of p.bookingRequest) {
          if (!req.bookingId) continue;

          const bookingDoc = await Booking.findById(req.bookingId);
          if (
            bookingDoc &&
            req.quotePrice != null &&
            ["HalfPaid", "Paid", "Completed"].includes(bookingDoc.paymentStatus) &&
            bookingDoc.bookingStatus !== "Completed"
          ) {
            hasActiveBooking = true;
            break;
          }
        }

        if (hasActiveBooking) {
          console.log(
            `Skipping partner ${p.partnerName} (${p._id}) due to ongoing booking.`
          );
          continue; // Skip this partner
        }
      }

      // Push bookingRequest and notification
      await partner.updateOne(
        { _id: p._id },
        {
          $push: {
            bookingRequest: { bookingId: booking._id, quotePrice: null },
            notifications: {
              messageTitle: "New Booking Request",
              messageBody: "You have a new Booking Request.",
            },
          },
        }
      );

      // Check if booking was already confirmed
      const updatedPartner = await partner.findById(p._id);
      const matchingRequest = updatedPartner.bookingRequest.find(
        (request) =>
          request.bookingId.toString() === booking._id.toString() &&
          request.paymentStatus
      );

      if (matchingRequest) {
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
  } catch (error) {
    console.error("Error updating operators with new booking:", error);
  }
};

module.exports = updateOperatorsWithNewBooking;
