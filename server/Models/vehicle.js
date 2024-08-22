const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: String,
  unitType: String,
  type: [{
    typeName: String,
    scale: String,
    typeImage: String,
    typeOfLoad: [{ load: String }]
  }],
});

module.exports = mongoose.model('Vehicle', vehicleSchema);