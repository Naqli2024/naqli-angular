const path = require('path');
const fs = require('fs');

// Function to handle file serving
const getFile = (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '../uploads/pdf', fileName);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Send file to client
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error sending file' });
      }
    });
  });
};

// Export the controller function
module.exports = {
  getFile,
};