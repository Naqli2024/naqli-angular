const user = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
require("dotenv").config();
const twilio = require("twilio");

/*****************************************
            User registration
 ****************************************/
const userRegister = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existUser = await user.findOne({
      emailAddress: req.body.emailAddress,
    });
    if (existUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
        data: null,
      });
    }

    // Check if password and confirmPassword match
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false,
        data: null,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;
    const hashedConfirmPassword = await bcrypt.hash(
      req.body.confirmPassword,
      10
    );
    req.body.confirmPassword = hashedConfirmPassword;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Create new user with OTP and its expiry time
    const newUser = new user({
      ...req.body,
      resetOTP: otp,
      otpExpiry: Date.now() + 300000, // 5 minutes expiry
    });
    await newUser.save();

    // Send OTP to user's contact number
    try {
      const otpResponse = await sendOTP(req.body.contactNumber, otp);

      res.status(200).json({
        message: "User created successfully. OTP sent to contact number.",
        success: true,
        data: {
          otpResponse: otpResponse.data,
          user: newUser,
        },
      });
    } catch (otpError) {
      res.status(500).json({
        message: "User created but failed to send OTP.",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Error during user registration:", error.message);
    res.status(400).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

/*****************************************
            Send OTP 
 *****************************************/
// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


// Function to send OTP to the user's contact number using Twilio
const sendOTP = async (contactNumber, otp) => {
  const from = "+12563716772"; // Replace with your Twilio phone number
  const to = `+ ${contactNumber}`;
  const text = `Your verification code is ${otp}`;

  try {
    const message = await client.messages.create({
      body: text,
      from: from,
      to: to,
    });

    console.log("Message sent successfully");
    console.log(message);

    return {
      message: `OTP sent to ${contactNumber}`,
      success: true,
      data: { messageId: message.sid },
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      message: "Error sending OTP",
      success: false,
      data: null,
    };
  }
};

/********************************************
          Resend OTP
 *******************************************/
const resendOTP = async (req, res) => {
  try {
    const { emailAddress } = req.body; // Assuming you pass userId to identify the user

    // Find the user by userId
    const existUser = await user.findOne({ emailAddress });

    if (!existUser) {
      return res.status(400).json({
        message: "User not found",
        success: false,
        data: null,
      });
    }

    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

    // Update user's OTP and OTP expiry
    existUser.resetOTP = newOTP;
    existUser.otpExpiry = Date.now() + 300000; // 5 minutes expiry

    await existUser.save();

    // Send new OTP to user's contact number
    const otpResponse = await sendOTP(existUser.contactNumber, newOTP); // Use your sendOTP function

    if (otpResponse.success) {
      return res.status(200).json({
        message: "New OTP sent successfully",
        success: true,
        data: { messageId: otpResponse.data.messageId }, // Optionally, you can include message ID or other data
      });
    } else {
      return res.status(500).json({
        message: "Failed to send new OTP",
        success: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Error resending OTP:", error.message);
    res.status(500).json({
      message: "Error resending OTP",
      success: false,
      data: null,
    });
  }
};

/********************************************
              Verify OTP
 *******************************************/
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // Find the user by the OTP received during registration
    const existUser = await user.findOne({ resetOTP: otp });

    if (!existUser) {
      return res.status(400).json({
        message: "Incorrect OTP",
        success: false,
        data: null,
      });
    }

    // Check OTP expiry (if needed, depending on your application logic)
    if (existUser.otpExpiry && existUser.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "Expired OTP",
        success: false,
        data: null,
      });
    }

    // Mark user as verified and clear OTP fields
    existUser.isVerified = true;
    existUser.resetOTP = null;
    existUser.otpExpiry = null;
    await existUser.save();

    res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      data: null, // You can include additional data if needed
    });
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    res.status(400).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const User = await user.findById(req.params.id);
    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(User);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await user.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBlocked, isSuspended } = req.body;

    const userStatus = await user.findByIdAndUpdate(userId, { isBlocked, isSuspended }, { new: true });

    if (!userStatus) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ success: true, data: userStatus });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};

exports.userRegister = userRegister;
exports.verifyOTP = verifyOTP;
exports.resendOTP = resendOTP;
exports.sendOTP = sendOTP;
exports.getUserById = getUserById;
exports.getAllUsers = getAllUsers;
exports.updateUserStatus = updateUserStatus;