const multer = require('multer');
const path = require('path');
const User = require('../../Models/userModel');
const Partner = require('../../Models/partner/partnerModel');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Directly specify the directory path
      cb(null, 'uploads/pictureOfTheReport');
    },
    filename: (req, file, cb) => {
      // Generate a unique file name with extension
      const uniqueSuffix = uuidv4(); 
      const extension = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${extension}`);
    },
  });
  
  const uploadReport = multer({ storage }).single('pictureOfTheReport');
  
  const addReport = (req, res) => {
    uploadReport(req, res, async (err) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ error: 'Error uploading file' });
      }
  
      const { email, reportMessage } = req.body;
      if (!email || !reportMessage ) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      try {
        const foundUser = await User.findOne({ emailAddress: email });
        const foundPartner = await Partner.findOne({ email });
  
        if (!foundUser && !foundPartner) {
          return res.status(404).json({ error: 'Email not found' });
        }
  
        const pictureOfTheReport = {
          contentType: req.file.mimetype,
          fileName: req.file.filename,
        };
  
        const report = {
          reportMessage,
          pictureOfTheReport,
        };
  
        if (foundUser) {
          foundUser.reportRequest.push(report);
          await foundUser.save();
          return res.status(200).json({
            message: 'Report added to user successfully',
            email,
            pictureOfTheReport,
          });
        }
  
        if (foundPartner) {
          foundPartner.reportRequest.push(report);
          await foundPartner.save();
          return res.status(200).json({
            message: 'Report added to partner successfully',
            email,
            pictureOfTheReport,
          });
        }
      } catch (error) {
        console.error('Internal server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  };

exports.uploadReport = uploadReport;
exports.addReport = addReport;