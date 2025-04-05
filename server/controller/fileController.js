const path = require('path');
const fs = require('fs');

const imageFolders = [
  'uploads/images',
  'uploads/partnerProfile',
  'uploads/pictureOfTheReport',
  'uploads/userPhoto',
  'uploads/userProfile'
];

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

const getImage = (req, res) => {
  const fileName = req.params.fileName;

  // Check each folder for the file
  const checkNext = (index) => {
    if (index >= imageFolders.length) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const folderPath = path.join(__dirname, '..', imageFolders[index]);
    const filePath = path.join(folderPath, fileName);

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        checkNext(index + 1); // Try next folder
      } else {
        res.sendFile(filePath, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error sending file' });
          }
        });
      }
    });
  };

  checkNext(0); 
};

// Export the controller function
module.exports = {
  getFile,
  getImage
};