const mongoose = require("mongoose");

const getAnEstimateSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
});

const estimate = mongoose.model("estimate", getAnEstimateSchema);
module.exports = estimate;
