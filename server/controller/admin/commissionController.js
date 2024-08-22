const Commission = require("../../Models/commissionModel");

const addCommission = async (req, res) => {
  const { userType, commissionRate, effectiveDate } = req.body;

  if (
    commissionRate < 0 ||
    commissionRate > 100 ||
    !Number.isInteger(commissionRate)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid commission rate. It must be an integer between 0 and 100.",
    });
  }

  try {
    const newCommission = new Commission({
      userType,
      commissionRate,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : Date.now(),
    });

    const savedCommission = await newCommission.save();

    return res.status(201).json({
      success: true,
      message: "Commission added successfully",
      commission: savedCommission,
    });
  } catch (error) {
    console.error("Error adding commission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add commission",
    });
  }
};

// Update an existing commission
const updateCommission = async (req, res) => {
  const { commissionRate, effectiveDate } = req.body;
  const { userType } = req.params;

  if (
    commissionRate < 0 ||
    commissionRate > 100 ||
    !Number.isInteger(commissionRate)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid commission rate. It must be an integer between 0 and 100.",
    });
  }

  try {
    const commission = await Commission.findOne({ userType });
    if (!commission) {
      return res
        .status(404)
        .json({ success: false, message: "Commission not found" });
    }

    commission.commissionRate = commissionRate;
    commission.effectiveDate = effectiveDate
      ? new Date(effectiveDate)
      : commission.effectiveDate;

    const updatedCommission = await commission.save();

    return res.status(200).json({
      success: true,
      message: "Commission updated successfully",
      commission: updatedCommission,
    });
  } catch (error) {
    console.error("Error updating commission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update commission",
    });
  }
};

const getCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find();
    res.status(200).json({ success: true, data: commissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCommission = addCommission;
exports.updateCommission = updateCommission;
exports.getCommissions = getCommissions;
