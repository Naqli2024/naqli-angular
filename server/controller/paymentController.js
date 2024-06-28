const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

exports.checkout = checkout;