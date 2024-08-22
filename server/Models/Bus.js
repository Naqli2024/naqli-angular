const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: String,
  unitType: String,
  image: String,
});

module.exports = mongoose.model('Bus', busSchema);