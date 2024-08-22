const express = require('express');
const router = express.Router();
const { insertData } = require('../controller/insertData');

router.get('/insertData', insertData);

module.exports = router;