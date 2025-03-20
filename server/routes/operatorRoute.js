const express = require("express");
const router = express.Router();
const operatorController = require("../controller/partner/operatorController");
const extraOperatorController = require("../controller/partner/extraOperatorController");

router.post("/add-operator", operatorController.parseFormData, operatorController.createOperator);
router.put("/edit-operator", operatorController.parseFormData, operatorController.editOperator);
router.delete("/delete-operator/:operatorId", operatorController.deleteOperator);
router.post("/add-extra-operator", extraOperatorController.parseFormData, extraOperatorController.createExtraOperator);
router.post("/operator-login", operatorController.operatorLogin);
router.post("/updateOperatorMode", operatorController.updateOperatorMode);
router.post("/getBookingRequest", operatorController.getBookingRequest);

module.exports = router;
