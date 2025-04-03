const Partner = require("../Models/partner/partnerModel");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 15, checkperiod: 30 });

// Update driver location
const updateDriverLocation = async (req, res) => {
  const { partnerId, operatorId, latitude, longitude } = req.body;

  if (!partnerId || !operatorId || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const partner = await Partner.findById(partnerId).lean();
    if (!partner) {
      return res.status(404).json({ error: "Partner not found." });
    }

    const inOperators = partner.operators?.some((group) =>
      group.operatorsDetail?.some((op) => op._id.toString() === operatorId)
    );

    const inExtraOperators = partner.extraOperators?.some(
      (op) => op._id.toString() === operatorId
    );

    if (!inOperators && !inExtraOperators) {
      return res.status(404).json({ error: "Operator not found." });
    }

    // MongoDB update logic
    if (inOperators) {
      await Partner.updateOne(
        { _id: partnerId, "operators.operatorsDetail._id": operatorId },
        {
          $set: {
            "operators.$[].operatorsDetail.$[op].latitude": latitude,
            "operators.$[].operatorsDetail.$[op].longitude": longitude,
            "operators.$[].operatorsDetail.$[op].timeStamp": Date.now(),
          },
        },
        { arrayFilters: [{ "op._id": operatorId }] }
      );
    } else if (inExtraOperators) {
      await Partner.updateOne(
        { _id: partnerId, "extraOperators._id": operatorId },
        {
          $set: {
            "extraOperators.$.latitude": latitude,
            "extraOperators.$.longitude": longitude,
            "extraOperators.$.timeStamp": Date.now(),
          },
        }
      );
    }

    res.json({ message: "Location updated successfully." });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getDriverLocation = async (req, res) => {
  const { partnerId, operatorId } = req.params;

  if (!partnerId || !operatorId) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  // Check cache first to avoid hitting DB frequently
  const cacheKey = `${partnerId}-${operatorId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.json(cachedData); // Return cached location
  }

  try {
    const partner = await Partner.findById(partnerId).lean();
    if (!partner) {
      return res.status(404).json({ error: "Partner not found." });
    }

    let driver = null;
    for (const group of partner.operators || []) {
      driver = group.operatorsDetail?.find((op) => op._id.toString() === operatorId);
      if (driver) break;
    }

    if (!driver) {
      driver = partner.extraOperators?.find((op) => op._id.toString() === operatorId);
    }

    if (!driver) {
      return res.status(404).json({ error: "Operator not found." });
    }

    // Prepare response data
    const responseData = {
      operatorId: driver._id,
      latitude: driver.latitude,
      longitude: driver.longitude,
      timeStamp: driver.timeStamp,
    };

    // Store in cache to reduce DB hits
    cache.set(cacheKey, responseData);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.updateDriverLocation = updateDriverLocation;
exports.getDriverLocation = getDriverLocation;
