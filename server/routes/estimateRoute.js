const express = require('express');
const router = express.Router();
const estimateController = require("../controller/getAnEstimateController");

router.post('/get-an-estimate', estimateController.getAnEstimate);

module.exports = router;