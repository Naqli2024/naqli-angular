const NaqleeUser = require("../../Models/NaqleeUser");

const createNaqleeUser = async (req, res) => {
  try {
    const { name, emailID, mobileNo, address, accessTo } = req.body;

    // Create a new user without the photo first
    const newUser = new NaqleeUser({
      name,
      emailID,
      mobileNo,
      address,
      accessTo,
    });

    const savedUser = await newUser.save();
    return savedUser._id; // Return the user ID to be used in the filename
  } catch (error) {
    console.error("Error creating NaqleeUser:", error);
    throw new Error(error.message);
  }
};

const updateNaqleeUserPhoto = async (userId, file) => {
  try {
    const user = await NaqleeUser.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.userPhoto = {
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.filename, // Save the filename for reference
    };

    await user.save();
  } catch (error) {
    console.error("Error updating NaqleeUser photo:", error);
    throw new Error(error.message);
  }
};

const getAllNaqleeUsers = async (req, res) => {
  try {
    const naqleeUsers = await NaqleeUser.find();
    res.status(200).json({ success: true, data: naqleeUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNaqleeUserById = async (req, res) => {
  try {
    const naqleeUser = await NaqleeUser.findById(req.params.id);
    if (!naqleeUser) {
      return res.status(404).json({ message: "NaqleeUser not found" });
    }
    res.status(200).json({ success: true, data: naqleeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteNaqleeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await NaqleeUser.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'NaqleeUser not found' });
    }

    res.status(200).json({ success: true, message: 'NaqleeUser deleted successfully', data: deletedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An error occurred', error });
  }
};



module.exports = {
  createNaqleeUser,
  updateNaqleeUserPhoto,
  getAllNaqleeUsers,
  getNaqleeUserById,
  deleteNaqleeUser
};
