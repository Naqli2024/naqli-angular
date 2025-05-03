const { check } = require("express-validator");

const userRegisterValidation = [
  check("firstName").notEmpty().withMessage("First name is required"),
  check("lastName").notEmpty().withMessage("Last name is required"),
  check("emailAddress")
    .isEmail()
    .withMessage("Email is invalid")
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage("Invalid Email Address"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required"),
  check("contactNumber")
    .notEmpty()
    .withMessage("Contact number is required"),
    // .isLength({ min: 10, max: 10 })
    // .withMessage("Contact number must be exactly 10 digits long")
    // .isNumeric()
    // .withMessage("Contact number must be numeric"),
  check("address1")
    .notEmpty()
    .withMessage("Address1 is required"),
  check("city").notEmpty().withMessage("City is required"),
  check("accountType").notEmpty().withMessage("Account type is required"),
  check("govtId").notEmpty().withMessage("Government ID is required"),
  check("idNumber")
    .notEmpty()
    .withMessage("ID Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("ID Number must be exactly 10 digits long")
    .isNumeric()
    .withMessage("ID Number must be numeric"),
];

module.exports = userRegisterValidation;
