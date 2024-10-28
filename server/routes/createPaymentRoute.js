const express = require("express");
const router = express.Router();
const paymentController = require("../controller/createPayment");

// Route for creating a payment
router.post("/create-payment", paymentController.createPayment);
router.get("/payment-status/:checkoutId", async (req, res) => {
  const checkoutId = req.params.checkoutId;
  const { paymentBrand } = req.query;

  try {
    const paymentStatus = await paymentController.getPaymentStatus(
      checkoutId,
      paymentBrand
    );
    res.json(paymentStatus);
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
