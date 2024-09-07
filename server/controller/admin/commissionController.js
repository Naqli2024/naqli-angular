const Commission = require("../../Models/commissionModel");

const createCommission = async (req, res) => {
  try {
    const { userType, slabRates } = req.body;

    // Validate request
    if (!userType || !slabRates || !Array.isArray(slabRates)) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    // Format the slab rates for comparison and ensure numeric values
    const formattedSlabRates = slabRates.map((rate) => ({
      slabRateStart: Number(rate.slabRateStart),
      slabRateEnd: Number(rate.slabRateEnd),
      commissionRate: rate.commissionRate,
    }));

    // Check for duplicate slabRateStart and slabRateEnd values in the new data
    const slabRateStarts = new Set();
    const slabRateEnds = new Set();

    for (const rate of formattedSlabRates) {
      if (slabRateStarts.has(rate.slabRateStart)) {
        return res
          .status(400)
          .json({ message: `Duplicate slabRateStart: ${rate.slabRateStart}` });
      }
      if (slabRateEnds.has(rate.slabRateEnd)) {
        return res
          .status(400)
          .json({ message: `Duplicate slabRateEnd: ${rate.slabRateEnd}` });
      }
      slabRateStarts.add(rate.slabRateStart);
      slabRateEnds.add(rate.slabRateEnd);
    }

    // Find the existing commission for the given userType
    const existingCommission = await Commission.findOne({ userType });

    if (existingCommission) {
      // Existing slabRates
      const existingSlabRates = existingCommission.slabRates.map((rate) => ({
        slabRateStart: Number(rate.slabRateStart),
        slabRateEnd: Number(rate.slabRateEnd),
      }));

      // Create sets for existing slabRateStart and slabRateEnd values
      const existingRateStarts = new Set(
        existingSlabRates.map((rate) => rate.slabRateStart)
      );
      const existingRateEnds = new Set(
        existingSlabRates.map((rate) => rate.slabRateEnd)
      );

      // Check if any new slabRateStart or slabRateEnd values already exist
      for (const rate of formattedSlabRates) {
        if (existingRateStarts.has(rate.slabRateStart)) {
          return res
            .status(400)
            .json({
              message: `Duplicate slabRateStart: ${rate.slabRateStart} is already present`,
            });
        }
        if (existingRateEnds.has(rate.slabRateEnd)) {
          return res
            .status(400)
            .json({
              message: `Duplicate slabRateEnd: ${rate.slabRateEnd} is already present`,
            });
        }
      }

      // Create a set for existing slabRateStart and slabRateEnd combinations
      const existingRatesSet = new Set(
        existingSlabRates.map(
          (rate) => `${rate.slabRateStart}-${rate.slabRateEnd}`
        )
      );

      // Filter new slabRates that do not exist in the existing slabRates
      const newSlabRates = formattedSlabRates.filter((newRate) => {
        const key = `${newRate.slabRateStart}-${newRate.slabRateEnd}`;
        return !existingRatesSet.has(key);
      });

      if (newSlabRates.length > 0) {
        // Append new slabRates to existingSlabRates
        existingCommission.slabRates.push(...newSlabRates);

        // Save the updated commission
        await existingCommission.save();
      }

      // Return the updated slabRates
      res.status(200).json({
        message: "Commission rates updated successfully",
        slabRates: existingCommission.slabRates,
      });
    } else {
      // Create a new Commission entry if no existing commission found
      const newCommission = new Commission({
        userType,
        slabRates: formattedSlabRates,
      });

      await newCommission.save();

      res.status(201).json({
        message: "Commission rates created successfully",
        slabRates: newCommission.slabRates,
      });
    }
  } catch (error) {
    // Check for duplicate key error (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // Get the field that caused the error
      return res.status(400).json({
        message: `Duplicate value for ${field}: ${error.keyValue[field]}`,
      });
    }

    res.status(500).json({ message: "Failed to create commission rate" });
  }
};

const getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find();
    res.status(200).json({ commissions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching commission data", error });
  }
};

const editCommission = async (req, res) => {
  try {
    const { slabRateId } = req.params;
    const { slabRateStart, slabRateEnd, commissionRate } = req.body;

    if (
      slabRateStart === null || slabRateStart === undefined ||
      slabRateEnd === null || slabRateEnd === undefined ||
      commissionRate === null || commissionRate === undefined
    ) {
      return res.status(400).json({ message: "Invalid data provided" });
    }

    const updatedCommission = await Commission.findOneAndUpdate(
      { "slabRates._id": slabRateId }, 
      {
        $set: {
          "slabRates.$.slabRateStart": slabRateStart,
          "slabRates.$.slabRateEnd": slabRateEnd,
          "slabRates.$.commissionRate": commissionRate,
        },
      },
      { new: true } 
    );

    if (!updatedCommission) {
      return res.status(404).json({ message: "Slab rate not found" });
    }

    res.status(200).json({
      message: "Slab rate updated successfully",
      slabRates: updatedCommission.slabRates, 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update slab rate" });
  }
};

const deleteCommission = async (req, res) => {
  try {
    const { slabRateId } = req.params; 

    const updatedCommission = await Commission.findOneAndUpdate(
      { "slabRates._id": slabRateId }, 
      {
        $pull: { slabRates: { _id: slabRateId } }, 
      },
      { new: true } 
    );

    if (!updatedCommission) {
      return res.status(404).json({ message: "Slab rate not found" });
    }

    res.status(200).json({
      message: "Slab rate deleted successfully",
      slabRates: updatedCommission.slabRates, 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete slab rate" });
  }
};

exports.createCommission = createCommission;
exports.getAllCommissions = getAllCommissions;
exports.editCommission = editCommission;
exports.deleteCommission = deleteCommission;