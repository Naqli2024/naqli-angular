const jwt = require("jsonwebtoken");
const user = require("../Models/userModel");

const emailVerification = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Token is missing", success: false });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN);
    const existUser = await user.findOne({
      emailAddress: decoded.email,
      verificationToken: token,
    });

    if (!existUser || existUser.verificationTokenExpires < Date.now()) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired", success: false });
    }

    // Update user's verification status
    existUser.isVerified = true;
    existUser.verificationToken = null;
    existUser.verificationTokenExpires = null;
    await existUser.save();

    res
      .status(200)
      .json({ message: "Email verified successfully", success: true });
  } catch (error) {
    console.error("Error during email verification:", error.message);
    res.status(400).json({ message: error.message, success: false });
  }
};

module.exports = emailVerification;
