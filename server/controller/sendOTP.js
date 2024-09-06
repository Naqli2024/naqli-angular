const axios = require('axios');
require('dotenv').config();

const UNIMATRIX_API_URL = 'https://api.unimtx.com/v1/otp/send';  // Correct API URL
const ACCESS_KEY_ID = process.env.UNIMATRIX_ACCESS_KEY_ID;

exports.sendOtp = async (req, res) => {
    const { phone_number, message, template } = req.body;

    if (!phone_number || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
    }

    try {
        const response = await axios.post(UNIMATRIX_API_URL, {
            phone_number: phone_number,
            message: message,
            template: template || 'default'
        }, {
            headers: {
                'Authorization': `Bearer ${ACCESS_KEY_ID}`,
                'Content-Type': 'application/json'
            }
        });

        // Check the response from Unimatrix
        if (response.data.code === "0") {
            res.status(200).json({ message: 'OTP sent successfully', data: response.data });
        } else {
            res.status(400).json({ error: 'Failed to send OTP', details: response.data });
        }
    } catch (error) {
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};