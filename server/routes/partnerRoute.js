const express = require("express");
const router = express.Router();
const partnerController = require("../controller/partner/partnerController");
const getPartnerDetailsController = require("../controller/partner/getPartnerDetailsController");
const partnerRegisterValidation = require("../middlewares/partnerRegisterValidation");
const partnerLoginController = require("../controller/partner/partnerLoginController");
const forgotPassword = require("../controller/partner/forgetPasswordController");
const { check } = require("express-validator");
const { protect } = require("../middlewares/authMiddleware");

const forgetPartnerPasswordValidation = [
  check("email")
    .isEmail()
    .withMessage("Email is invalid")
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .withMessage("Invalid Email Address"),
]

router.post(
  "/register",
  partnerRegisterValidation,
  partnerController.partnerRegister
);
router.post("/resend-otp", partnerController.resendOTP);
router.post(
  "/verify-otp",
  [check("otp").not().isEmpty().withMessage("OTP is required")],
  partnerController.verifyOTP
);
router.put("/updatePartnerName/:partnerId",  partnerController.updatePartnerName);
router.get("/checkPartner/:partnerName", partnerController.checkPartnerExists)
router.get("/:id", getPartnerDetailsController.getPartnerDetails);
router.post("/login", partnerLoginController.partnerLogin);
router.post('/forgot-password', forgetPartnerPasswordValidation, forgotPassword.forgotPassword);
router.post('/verify-otp-update-password', forgotPassword.verifyOTPAndUpdatePassword);
router.post("/update-quote", partnerController.updateQuotePrice);
router.delete("/:partnerId/booking-request/:bookingId", protect, partnerController.deletedBookingRequest);
router.post("/filtered-vendors", partnerController.getTopPartners);
router.get('/', partnerController.getAllPartners);
router.put('/partners/:id/status', partnerController.updatePartnerStatus);
router.post('/:partnerId/company-details', partnerController.addCompanyDetails);

module.exports = router;
