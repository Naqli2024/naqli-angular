const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const clickpay = require('clickpay_pt2');
const axios = require('axios');
const qs = require('qs');

const checkout = async (req, res) => {
  try {
    token = req.body.token;
    const customer = stripe.customers
      .create({
        email: "jrpixelz7@gmail.com",
        source: token.id,
      })
      .then((customer) => {
        console.log(customer);
        return stripe.charges.create({
          amount: 1000,
          description: "Naqli Trasportation",
          currency: "USD",
          customer: customer.id,
        });
      })
      .then((charge) => {
        console.log(charge);
        res.json({
          message: "Payment success!",
          success: true,
        });
      })
      .catch((err) => {
        res.json({
          message: "Payment failed!",
          success: false,
        });
      });
    return true;
  } catch (error) {
    return false;
  }
};


// Initialize Clickpay with your config
clickpay.setConfig(process.env.PROFILE_ID, process.env.SERVER_KEY, process.env.REGION);

const createPaymentPage = (req, res) => {
  const { payment_methods, transaction, cart, customer, shipping, urls, lang, framed } = req.body;

  clickpay.createPaymentPage(
      payment_methods,
      transaction,
      cart,
      customer,
      shipping,
      urls,
      lang,
      (result) => {
          res.json(result);
      },
      framed
  );
}

const validatePayment = (req, res) => {
  const { transRef } = req.body;

  clickpay.validatePayment(transRef, (result) => {
      res.json(result);
  });
}

exports.checkout = checkout;
exports.createPaymentPage = createPaymentPage;
exports.validatePayment = validatePayment;