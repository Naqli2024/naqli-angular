const { check } = require("express-validator");

const partnerRegisterValidation = [
  check("type", "Type is required").not().isEmpty(),
  check("partnerName", "Partner Name is required").not().isEmpty(),
  check("mobileNo", "Mobile No is required").not().isEmpty(),
  check("email")
    .isEmail()
    .withMessage("Please include a valid email")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage("Email must be in a valid format"),
  check("password", "Password is required").not().isEmpty(),
];

module.exports = partnerRegisterValidation;
