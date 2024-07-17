const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const naqleeUserSchema = new Schema(
  {
    name: { type: String, required: true },
    userPhoto: {
      data: { type: Buffer },
      contentType: { type: String },
      fileName: { type: String }, // Save the filename for reference
    },
    emailID: { type: String, required: true },
    mobileNo: { type: String, required: true },
    address: { type: String, required: true },
    accessTo: {
      type: [
        {
          type: String,
          enum: [
            "Payout",
            "Support tickets",
            "User",
            "Partner",
            "Payments",
            "Notification Management",
            "Naqlee user",
          ],
        },
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NaqleeUser", naqleeUserSchema);
