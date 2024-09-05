const Commission = require("../../Models/commissionModel");

const createCommission = async (req, res) => {
  try {
    const { userType, slabRates } = req.body;

    // Validate request
    if (!userType || !slabRates || !Array.isArray(slabRates)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    // Check if commission for this userType already exists
    const existingCommission = await Commission.findOne({ userType });
    if (existingCommission) {
      return res
        .status(400)
        .json({ message: "Commission rates for this user type already exist" });
    }

    // Append 'SAR' to slabRateStart and slabRateEnd
    const formattedSlabRates = slabRates.map((rate) => ({
      slabRateStart: rate.slabRateStart,
      slabRateEnd: rate.slabRateEnd,
      commissionRate: rate.commissionRate
    }));

    // Create a new Commission entry
    const newCommission = new Commission({
      userType,
      slabRates: formattedSlabRates,
    });

    await newCommission.save();

    res
      .status(201)
      .json({
        message: "Commission rates created successfully",
        commission: newCommission,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createCommission = createCommission;
