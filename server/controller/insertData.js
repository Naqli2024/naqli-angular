const Vehicle = require('../Models/vehicle');
const Bus = require('../Models/Bus');
const Equipment = require('../Models/Equipment');
const Special = require('../Models/Special');
const jsonData = require('../data/db.json');

const insertData = async (req, res) => {
  try {
    // Insert vehicles data
    await Vehicle.deleteMany({});
    await Vehicle.insertMany(jsonData.vehicles);

    // Insert bus data
    await Bus.deleteMany({});
    await Bus.insertMany(jsonData.bus);

    // Insert equipment data
    await Equipment.deleteMany({});
    await Equipment.insertMany(jsonData.equipment);

    // Insert special data
    await Special.deleteMany({});
    await Special.insertMany(jsonData.special);

    res.send('Data inserted successfully into MongoDB collections');
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Error inserting data into MongoDB collections');
  }
};

module.exports = {
  insertData
};