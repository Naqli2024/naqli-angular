const express = require("express");
const router = express.Router();
const operatorController = require("../controller/partner/operatorController");

router.post("/add-operator", operatorController.parseFormData, operatorController.createOperator);

module.exports = router;
