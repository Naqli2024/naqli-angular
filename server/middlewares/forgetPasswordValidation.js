const { check } = require("express-validator");

const forgotPasswordValidation = [
  check("emailAddress")
    .isEmail()
    .withMessage("Email is invalid")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage("Email must be in a valid format"),
];

module.exports = forgotPasswordValidation;
