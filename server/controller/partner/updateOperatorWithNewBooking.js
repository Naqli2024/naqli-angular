const partner = require("../../Models/partner/partnerModel");
const mongoose = require("mongoose");
const { normalizeCityOrRegion } = require("../normalizeCityOrRegion");

const isSaudiMatch = (input, target) => {
  if (!input || !target) return false;

  const inputValues = Array.isArray(input) ? input : [input];
  const targetValues = Array.isArray(target) ? target : [target];

  return inputValues.some((inputVal) =>
    targetValues.some((targetVal) =>
      inputVal === targetVal ||
      inputVal.includes(targetVal) ||
      targetVal.includes(inputVal)
    )
  );
};

const updateOperatorsWithNewBooking = async (booking, isCanceled = false) => {
  try {
    const { type, name, pickup, cityName, address } = booking;
    const subClassification = type && type.length > 0 ? type[0].typeName : "";

    if (isCanceled) {
      await partner.updateMany(
        { "bookingRequest.bookingId": booking._id },
        { $pull: { bookingRequest: { bookingId: booking._id } } }
      );
      return;
    }

    const partners = await partner.find({
      "operators.unitClassification": new RegExp(`^${name}$`, "i"),
      $or: [
        { "operators.type": { $exists: false } },
        { "operators.type": { $size: 0 } },
        { "operators.type.typeName": new RegExp(`^${subClassification}$`, "i") },
      ],
    });

    const normalizedPickup = normalizeCityOrRegion(pickup);
    const normalizedCityName = normalizeCityOrRegion(cityName);
    const normalizedAddress = normalizeCityOrRegion(address);

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

      if (!locationMatch && !regionMatch) {
        console.log(`No match for partner ${p._id}`);
        continue;
      }

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
