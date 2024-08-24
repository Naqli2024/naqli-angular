const express = require('express');
const router = express.Router();
const { getFile } = require('../controller/fileController');

// Route to serve files
router.get('/files/:fileName', getFile);

module.exports = router;