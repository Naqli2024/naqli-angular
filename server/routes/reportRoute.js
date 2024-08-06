const express = require('express');
const router = express.Router();
const reportController = require('../controller/admin/reportController');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage for pictureOfTheReport
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/pictureOfTheReport');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      const extension = file.originalname.split('.').pop();
      const fileName = `${uniqueSuffix}.${extension}`;
      cb(null, fileName);
    },
  });
  
const upload = multer({ storage: storage });

router.post('/add-report', upload.single('pictureOfTheReport'), reportController.createReportRequest);
router.get('/all-tickets', reportController.getAllTickets);
router.put('/updateReportRequest', reportController.updateReportRequest);
router.delete('/deleteTicket', reportController.deleteTicketByTicketId);

module.exports = router;