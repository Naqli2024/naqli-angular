const express = require("express");
const router = express.Router();
const operatorController = require("../controller/partner/operatorController");
const extraOperatorController = require("../controller/partner/extraOperatorController");

router.post("/add-operator", operatorController.parseFormData, operatorController.createOperator);
router.post("/add-extra-operator", extraOperatorController.parseFormData, extraOperatorController.createExtraOperator);
router.post("/operator-login", operatorController.operatorLogin);

module.exports = router;
