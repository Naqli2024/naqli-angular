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

    let { emailOrMobile, password } = req.body;
   
    emailOrMobile = emailOrMobile.toString().trim(); // Ensure string format
    if (emailOrMobile.includes("@")) {
      emailOrMobile = emailOrMobile.toLowerCase();
    }

    // Find partner by email or mobile
    const existPartner = await partner.findOne({
      $or: [{ email: emailOrMobile }, { mobileNo: emailOrMobile }],
    });

    if (!existPartner) {
      return res.status(400).send({
        message: "Partner does not exist",
        success: false,
        data: null,
      });
    }

    if (existPartner.isBlocked) {
      return res.status(400).send({
        message: "Your account is blocked",
        success: false,
        data: null,
      });
    }

    // Check if the partner is verified
    if (!existPartner.isVerified) {
      return res.status(403).send({
        message: "Account not verified! Verify your account",
        success: false,
        data: null,
      });
    }

    // Check password match
    const matchedPassword = await bcrypt.compare(
      password,
      existPartner.password
    );
    if (!matchedPassword) {
      console.log("Incorrect password:", password);
      return res.status(400).send({
        message: "Incorrect Password",
        success: false,
        data: null,
      });
    }

    // Generate token
    const token = jwt.sign(
      { partnerId: existPartner._id.toString() },
      process.env.JSON_WEB_TOKEN,
      { expiresIn: "1d" }
    );

    return res.status(200).send({
      message: "Logged in successfully",
      success: true,
      data: {
        token,
        partner: existPartner,
      },
    });
  } catch (error) {
    console.log("Error during partner login:", error);
    return res.status(500).send({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

exports.partnerLogin = partnerLogin;
