const Partner = require("../../Models/partner/partnerModel");
const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../partner/partnerController');
const { ObjectId } = require('mongoose').Types;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const forgotPassword = async (req, res) => {
  try {
     // Validate request
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }

     const existingPartner = await Partner.findOne({
      email: req.body.email
    });

    if (!existingPartner) {
      return res.status(400).send({
        message: "partner not found",
        success: false,
        data: null,
      });
    }

    const otp = generateOTP();
    // Save the OTP in the database or cache (e.g., Redis) associated with the user's email
    // For simplicity, we'll assume you save it in the user's document (not recommended for production)
    existingPartner.resetOTP = otp;
    existingPartner.otpExpiry = Date.now() + 3600000; // 1 hour expiration
    await existingPartner.save();

    // Send OTP to user's registered contact number
    const otpResponse = await sendOTP(existingPartner.mobileNo, otp);

    if (!otpResponse.success) {
      return res.status(500).json({
        message: 'Failed to send OTP',
        success: false,
        data: null
      });
    }

    res.status(200).send({
      message: "OTP sent successfully to registered contact number",
      success: true,
      data: otpResponse.data,
    });
  } catch (error) {
    console.error("Forgot Password error:", error.message);
    return res.status(500).send({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

// Function to verify OTP and update password
const verifyOTPAndUpdatePassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmNewPassword } = req.body;

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        success: false,
        data: null
      });
    }

    // Find user by OTP and its expiry
    const existingPartner = await Partner.findOne({
      resetOTP: otp,
      otpExpiry: { $gt: Date.now() }
    });

    if (!existingPartner) {
      return res.status(400).json({
        message: 'Incorrect or expired OTP',
        success: false,
        data: null
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    existingPartner.password = hashedPassword;

    // Clear OTP fields
    existingPartner.resetOTP = null;
    existingPartner.otpExpiry = null;

    // Save updated user document
    await existingPartner.save();

    // Generate JWT token for user authentication
    const token = jwt.sign({ userId: existingPartner._id }, process.env.JSON_WEB_TOKEN, { expiresIn: '1d' });

    // Respond with success message and token
    res.status(200).json({
      message: 'Password updated successfully',
      success: true,
      data: token
    });

  } catch (error) {
    console.error('Error in verifyOTPAndUpdatePassword:', error.message);
    res.status(500).json({
      message: 'Internal server error',
      success: false,
      data: null
    });
  }
};

exports.forgotPassword = forgotPassword
exports.verifyOTPAndUpdatePassword = verifyOTPAndUpdatePassword