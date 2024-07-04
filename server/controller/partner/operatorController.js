const Booking = require("../../Models/BookingModel");
const Partner = require("../../Models/partner/partnerModel");

const createOperator = async (req, res) => {
  try {
    const {
      unitType,
      unitClassification,
      subClassification,
      plateInformation,
      istimaraNo,
      firstName,
      lastName,
      email,
      mobileNo,
      iqamaNo,
      dateOfBirth,
      partnerName,
      partnerId
    } = req.body;

    const {
      istimaraCard,
      pictureOfVehicle,
      drivingLicense,
      aramcoLicense,
      nationalID,
    } = req.files;

    // Find the partner and add the operator reference
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Find matching bookings
    const matchingBookings = await Booking.find({
      name: unitClassification,
      $or: [
        { type: { $exists: false } },
        { type: { $size: 0 } },
        { type: { $elemMatch: { typeName: subClassification } } }
      ]
    });

    // Filter bookings based on paymentStatus and remove from bookingRequest
    const filteredBookings = matchingBookings.filter(booking =>
      !["halfPaid", "paid", "completed"].includes(booking.paymentStatus)
    );

    // Create a new operator
    const newOperator = {
      unitType,
      unitClassification,
      subClassification,
      plateInformation,
      istimaraNo,
      firstName,
      lastName,
      email,
      mobileNo,
      iqamaNo,
      dateOfBirth,
      partnerName,
      partnerId,
      istimaraCard: {
        data: istimaraCard[0].buffer,
        contentType: istimaraCard[0].mimetype,
      },
      pictureOfVehicle: {
        data: pictureOfVehicle[0].buffer,
        contentType: pictureOfVehicle[0].mimetype,
      },
      drivingLicense: {
        data: drivingLicense[0].buffer,
        contentType: drivingLicense[0].mimetype,
      },
      aramcoLicense: {
        data: aramcoLicense[0].buffer,
        contentType: aramcoLicense[0].mimetype,
      },
      nationalID: {
        data: nationalID[0].buffer,
        contentType: nationalID[0].mimetype,
      },
      bookingRequest: filteredBookings.map(booking => ({
        bookingId: booking._id,  
        quotePrice: null,  
      })),
    };

    // Add operator reference to partner
    partner.operators.push(newOperator);
    partner.partnerName = req.body.partnerName;
    await partner.save();

    res.status(201).json({
      success: true,
      message: "Operator created successfully",
      operator: newOperator,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message, success: false, data: null });
  }
};

exports.createOperator = createOperator;