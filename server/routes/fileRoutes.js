const express = require('express');
const router = express.Router();
const { getFile, getImage } = require('../controller/fileController');

// Route to serve files
router.get('/files/:fileName', getFile);
router.get('/image/:fileName', getImage);

module.exports = router;