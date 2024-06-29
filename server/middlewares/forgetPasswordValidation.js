const { check } = require("express-validator");

const forgotPasswordValidation = [
  check("emailAddress")
    .isEmail()
    .withMessage("Email is invalid")
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .withMessage("Invalid Email Address"),
];

module.exports = forgotPasswordValidation;
