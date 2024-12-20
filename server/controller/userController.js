const user = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
require("dotenv").config();
const axios = require("axios");
const querystring = require("querystring");

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

    const {
      firstName,
      lastName,
      emailAddress,
      password,
      confirmPassword,
      contactNumber,
      address1,
      city,
      accountType,
      govtId,
      idNumber,
    } = req.body;

    // Check for existing users with any of the fields
    const existUserByEmail = await user.findOne({ emailAddress });
    const existUserByIdNumber = await user.findOne({ idNumber });
    const existUserByContactNumber = await user.findOne({ contactNumber });

    // Initialize the message
    let message = "User with this ";

    // Check for existing email address
    if (existUserByEmail) {
      message += "email address ";
    }

    // Check for existing ID number
    if (existUserByIdNumber) {
      message += "ID number "; // Append "ID number" with "and" if necessary
    }

    // Check for existing contact number
    if (existUserByContactNumber) {
      message += "contact number"; // Append "contact number" with "and" if necessary
    }

    // If any user exists, send the message
    if (existUserByEmail || existUserByIdNumber || existUserByContactNumber) {
      message += " already exists.";

      return res.status(400).json({
        message: message,
        success: false,
        data: null,
      });
    }

    // Ensure that idNumber is exactly 10 digits long
    if (!/^\d{10}$/.test(idNumber)) {
      return res.status(400).json({
        message: "ID number must be exactly 10 digits long.",
        success: false,
        data: null,
      });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false,
        data: null,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedConfirmPassword = await bcrypt.hash(confirmPassword, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Create new user with OTP and its expiry time
    const newUser = new user({
      firstName,
      lastName,
      emailAddress,
      password: hashedPassword,
      confirmPassword: hashedConfirmPassword,
      contactNumber,
      address1,
      city,
      accountType,
      govtId,
      idNumber,
      resetOTP: otp,
      otpExpiry: Date.now() + 300000, // 5 minutes expiry
    });
    await newUser.save();

    // Send OTP to user's contact number
    try {
      const otpResponse = await sendOTP(contactNumber, otp);

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

// Function to send OTP to the user's contact number 
const sendOTP = async (contactNumber, otp) => {

   // Convert the number to a string for manipulation
   let contactNumberStr = contactNumber.toString();

  if (!contactNumberStr.startsWith('966')) {
    contactNumberStr = '966' + contactNumberStr.replace(/^0/, ''); // Remove leading 0 and add '966'
  }

  // Set the API URL and the token
  const apiUrl = "https://api.oursms.com";
  const apiToken = process.env.OURSMS_API_TOKEN;
  const messageBody = `Your OTP is: ${otp}`;

  const data = {
    src: "oursms",
    dests: [contactNumberStr],
    body: messageBody,
    priority: 0,
    delay: 0,
    validity: 0,
    maxParts: 0,
    dlr: 0,
    prevDups: 0,
    msgClass: "transactional",
  };
  try {
    const response = await axios.post(`${apiUrl}/msgs/sms`, data, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log("OTP sent successfully:", response);
    if (response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, message: "Failed to send OTP" };
    }
  } catch (error) {
    console.error("Error sending OTP:", error.response.data);
    throw new Error("Failed to send OTP");
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

    if (otpResponse) {
      return res.status(200).json({
        message: "New OTP sent successfully",
        success: true,
        data: otpResponse.data 
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

    const userStatus = await user.findByIdAndUpdate(
      userId,
      { isBlocked, isSuspended },
      { new: true }
    );

    if (!userStatus) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: userStatus });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user status", error: error.message });
  }
};

const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      emailAddress,
      password,
      confirmPassword,
      contactNumber,
      address1,
      city,
      govtId,
      idNumber,
    } = req.body;

    if (password || confirmPassword) {
      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Both passwords are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
    }

    let userProfile;
    if (req.file) {
      userProfile = {
        contentType: req.file.mimetype,
        fileName: req.file.filename,
      };
    }

    const updateUser = {
      firstName,
      lastName,
      emailAddress,
      contactNumber,
      address1,
      city,
      govtId,
      idNumber,
      userProfile,
    };

    if (password) {
      updateUser.password = await bcrypt.hash(password, 10);
    }

    //Remove the keys if getting undefined
    Object.keys(updateUser).forEach((key) => {
      if (updateUser[key] === undefined) {
        delete updateUser[key];
      }
    });
    const editedUser = await user.findByIdAndUpdate(userId, updateUser, {
      new: true,
    });

    if (!editedUser) {
      return res.status(500).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "Profile Updated!", data: editedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.userRegister = userRegister;
exports.verifyOTP = verifyOTP;
exports.resendOTP = resendOTP;
exports.sendOTP = sendOTP;
exports.getUserById = getUserById;
exports.getAllUsers = getAllUsers;
exports.updateUserStatus = updateUserStatus;
exports.editUser = editUser;
