const express = require('express');
const router = express.Router();
const reportController = require('../controller/admin/reportController');

router.post('/add-report', reportController.uploadReport, reportController.addReport);

module.exports = router;