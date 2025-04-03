const express = require('express');
const router = express.Router();
const driverLocationController = require('../controller/driverLocationController');

router.post('/driver-location', driverLocationController.updateDriverLocation);
router.get('/driver-location/:partnerId/:operatorId', driverLocationController.getDriverLocation);

module.exports = router;