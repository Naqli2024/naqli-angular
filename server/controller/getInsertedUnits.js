const Bus = require("../Models/Bus");
const Equipment = require("../Models/Equipment");
const Special = require("../Models/Special");
const Vehicle = require("../Models/vehicle")

const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    res.status(200).json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllBuses = async (req, res) => {
    try {
      const buses = await Bus.find({});
      res.status(200).json(buses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
};

const getAllEquipments = async (req, res) => {
    try {
      const equipments = await Equipment.find({});
      res.status(200).json(equipments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
};

const getAllSpecialUnits = async (req, res) => {
    try {
      const specialUnits = await Special.find({});
      res.status(200).json(specialUnits);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllVehicles = getAllVehicles;
exports.getAllBuses = getAllBuses;
exports.getAllEquipments = getAllEquipments;
exports.getAllSpecialUnits = getAllSpecialUnits;