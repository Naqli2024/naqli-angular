const express = require("express");
const router = express.Router();
const partnerController = require("../controller/partner/partnerController");
const partnerRegisterValidation = require("../middlewares/partnerRegisterValidation");
const { check } = require("express-validator");

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

module.exports = router;
