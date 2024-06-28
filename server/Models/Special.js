const mongoose = require('mongoose');

const specialSchema = new mongoose.Schema({
  name: String,
  image: String
});

module.exports = mongoose.model('Special', specialSchema);