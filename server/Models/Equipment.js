const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: String,
  unitType: String,
  type: [{
    typeName: String,
    typeImage: String
  }],
});

module.exports = mongoose.model('Equipment', equipmentSchema);