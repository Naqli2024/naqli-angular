const https = require("https");
const querystring = require("querystring");
const userModel = require("../Models/userModel");


const createPayment = async (req, res) => {
  let { amount, paymentBrand, userId } = req.body;

    // Ensure amount is a number and round it to the nearest whole number
  if (typeof amount !== "number") {
    amount = parseFloat(amount); // Convert to number if necessary
  }

  // Round the amount to the nearest whole number
  amount = Math.round(amount);

  // Optionally, ensure it's a valid whole number
  if (amount <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid amount format. Must be a valid whole number." });
  }
  
// Fetch user details
let user;
try {
  user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
} catch (error) {
  return res.status(500).json({ error: "Error fetching user details", message: error.message });
}

// Generate a random merchantTransactionId
const merchantTransactionId = Array(24)
  .fill(null)
  .map(() => Math.random().toString(36).charAt(2)) // Random letters and numbers
  .join("");

  // Determine entityId based on paymentBrand
  let entityId;
  if (paymentBrand === "MADA") {
    entityId = process.env.ENTITY_ID_MADA; 
  } else {
    entityId = process.env.ENTITY_ID; 
  }

  const path = "/v1/checkouts";
  const data = querystring.stringify({
    entityId: entityId,
    amount: amount,
    currency: "SAR",
    paymentType: "DB",
    integrity: "true",
    "customer.givenName": user.firstName,
    "customer.surname": user.lastName,
    "customer.email": user.emailAddress,
    merchantTransactionId: merchantTransactionId,
  });

  const options = {
    port: 443,
    host: "eu-prod.oppwa.com",
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": data.length,
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  };

  // Make the HTTPS request and return the response
  return new Promise((resolve, reject) => {
    const postRequest = https.request(options, function (response) {
      const buffer = [];
      response.on("data", (chunk) => {
        buffer.push(Buffer.from(chunk));
      });

      response.on("end", () => {
        const responseString = Buffer.concat(buffer).toString("utf8");
        try {
          const jsonResponse = JSON.parse(responseString);
          res.status(200).json(jsonResponse); // Send JSON response
        } catch (error) {
          res.status(500).json({ error: "Failed to parse response" });
        }
      });
    });

    postRequest.on("error", (error) => {
      reject(error);
      res.status(500).json({ error: "Request error", message: error.message });
    });

    postRequest.write(data);
    postRequest.end();
  });
};

const getPaymentStatus = async (checkoutId, paymentBrand) => {
  // Determine the entityId based on paymentBrand
  let entityId;
  if (paymentBrand === "MADA") {
    entityId = process.env.ENTITY_ID_MADA; // Use MADA-specific entityId
  } else {
    entityId = process.env.ENTITY_ID; // Use generic card (VISA, MasterCard, etc.) entityId
  }

  const path = `/v1/checkouts/${checkoutId}/payment?entityId=${entityId}`;

  const options = {
    port: 443,
    host: "eu-prod.oppwa.com",
    path: path,
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
    },
  };

  return new Promise((resolve, reject) => {
    const postRequest = https.request(options, (res) => {
      const buf = [];
      res.on("data", (chunk) => {
        buf.push(Buffer.from(chunk));
      });
      res.on("end", () => {
        const jsonString = Buffer.concat(buf).toString("utf8");
        if (res.statusCode !== 200) {
          // Reject with status code and message if not OK
          return reject({
            statusCode: res.statusCode,
            message: jsonString,
          });
        }

        try {
          resolve(JSON.parse(jsonString));
        } catch (error) {
          reject(error);
        }
      });
    });

    postRequest.on("error", (error) => {
      reject({
        statusCode: 500,
        message: error.message,
      });
    });

    postRequest.end();
  });
};

module.exports = { createPayment, getPaymentStatus };
