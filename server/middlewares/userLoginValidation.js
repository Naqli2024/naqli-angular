const { check } = require("express-validator");

const userLoginValidation = [
  check("emailAddress")
    .isEmail()
    .withMessage("Email is invalid")
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .withMessage("Invalid Email Address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

module.exports = userLoginValidation;
