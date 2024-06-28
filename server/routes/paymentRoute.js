const express = require('express');
const router = express.Router();
const paymentController = require('../controller/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/checkout', protect, paymentController.checkout);

module.exports = router;