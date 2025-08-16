const mongoose = require("mongoose");

const deletedUserSchema = new mongoose.Schema({
  originalUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
  deletedAt: { type: Date, default: Date.now },
  userData: { type: Object, required: true }
});

module.exports = mongoose.model("deletedUsers", deletedUserSchema);