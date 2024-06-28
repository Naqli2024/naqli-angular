const { check } = require("express-validator");

const partnerRegisterValidation = [
    check("type", "Type is required").not().isEmpty(),
    check("partnerName", "Partner Name is required").not().isEmpty(),
    check("mobileNo", "Mobile No is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").not().isEmpty(),
];

module.exports = partnerRegisterValidation;
