const partner = require("../../Models/partner/partnerModel");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Partner Login Controller
const partnerLogin = async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { emailOrMobile, password } = req.body;
      const existPartner = await partner.findOne({
        $or: [
          { email: emailOrMobile },
          { mobileNo: emailOrMobile }
        ]
      });

      if (!existPartner) {
        return res.status(400).send({
          message: "Partner does not exist",
          success: false,
          data: null,
        });
      }

      if(existPartner.isBlocked) {
        return res.status(400).send({
          message: "Your account is blocked",
          success: false,
          data: null
        })
      }

      // Check if the partner is verified
      if (!existPartner.isVerified) {
        return res.status(403).send({
          message: "Account not verified! Verify your account",
          success: false,
          data: null,
        });
      }

      // Check password
      const matchedPassword = await bcrypt.compare(
        password,
        existPartner.password
      );
      if (!matchedPassword) {
        return res.status(400).send({
          message: "Incorrect Password",
          success: false,
          data: null,
        });
      }

      // Generate token
      const token = jwt.sign(
        { partnerId: existPartner._id },
        process.env.JSON_WEB_TOKEN,
        {
          expiresIn: "365d",
        }
      );

      return res.status(200).send({
        message: "Logged in successfully",
        success: true,
        data: {
          token,
          partner: existPartner
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

exports.partnerLogin = partnerLogin;