const NaqleeUser = require('../../Models/NaqleeUser'); 

// Update NaqleeUser
const updateNaqleeUser = async (req, res) => {
  const userId = req.params.id;
  const { name, emailID, mobileNo, address, accessTo } = req.body;

  // Check if a new userPhoto is provided
  let userPhoto;
  if (req.file) {
    userPhoto = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      fileName: req.file.originalname
    };
  }

  try {
    const updatedUser = await NaqleeUser.findByIdAndUpdate(
      userId,
      {
        name,
        emailID,
        mobileNo,
        address,
        userPhoto,
        accessTo
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return userId;
  } catch (err) {
    console.error("Error creating NaqleeUser:", err);
    throw new Error(err.message);
  }
};

module.exports = { updateNaqleeUser };