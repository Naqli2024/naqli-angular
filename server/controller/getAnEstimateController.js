const mongoose = require("mongoose");
const Estimate = require("../Models/getAnEstimateModel");

const getAnEstimate = async(req, res) => {
    const {name, mobile, email} = req.body;
    try {
        if(!name && !email && !mobile) {
            return res.status(404).json({
                success: false,
                data: null,
                message: "Require fields are missing"
            })
        }
        const newEstimate = new Estimate(req.body);
        await newEstimate.save();

        return res.status(200).json({
            success: true,
            data: newEstimate,
            message: "Form submitted"
        })
    }catch(error) {
        return res.status(500).json({
            success: false,
            data: null,
            message: error.message
        })
    }
}

exports.getAnEstimate = getAnEstimate;