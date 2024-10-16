const user = require("../Models/userModel");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//Login Controller
const userLogin = async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const existEmail = await user.findOne({
        emailAddress: req.body.emailAddress,
      });
      if (!existEmail) {
        return res.status(400).send({
          message: "User does not exist",
          success: false,
          data: null,
        });
      }

       // Check if the user is blocked
    if (existEmail.isBlocked) {
      return res.status(400).send({
        message: "Your account is blocked",
        success: false,
        data: null,
      });
    }

         // Check if the user is verified
    if (!existEmail.isVerified) {
      return res.status(403).send({
        message: "User not verified",
        success: false,
        data: null,
      });
    }
  
      const matchedPassword = await bcrypt.compare(
        req.body.password,
        existEmail.password
      );
      if (!matchedPassword) {
        return res.status(400).send({
          message: "Incorrect Password",
          success: false,
          data: null,
        });
      }
      const token = jwt.sign(
        { userId: existEmail._id },
        process.env.JSON_WEB_TOKEN,
        {
          expiresIn: "365d",
        }
      );
      const loggedInUser = await user.findById(existEmail._id);
      return res.status(200).send({
        message: "Logged in successfully",
        success: true,
        data: {
          token,
          user: loggedInUser
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      return res.status(500).send({
        message: error.message,
        success: false,
        data: null,
      });
    }
  };

  module.exports = userLogin