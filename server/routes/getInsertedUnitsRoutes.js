const express = require('express');
const router = express.Router();
const getInsertedUnitController = require("../controller/getInsertedUnits")

router.get('/vehicles', getInsertedUnitController.getAllVehicles);
router.get('/buses', getInsertedUnitController.getAllBuses);
router.get('/equipments', getInsertedUnitController.getAllEquipments);
router.get('/special-units', getInsertedUnitController.getAllSpecialUnits);

module.exports = router;