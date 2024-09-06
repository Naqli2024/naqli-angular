const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createNaqleeUser, updateNaqleeUserPhoto ,getAllNaqleeUsers, getNaqleeUserById, deleteNaqleeUser
} = require("../controller/admin/naqleeUserController");
const { v4: uuidv4 } = require("uuid");
const { updateNaqleeUser } = require("../controller/admin/naqleeUserUpdate");
const notificationController = require("../controller/admin/addNotificationController");
const commissionController = require("../controller/admin/commissionController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/userPhoto");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4(); 
    const extension = file.originalname.split('.').pop();
    cb(null, `${uniqueSuffix}.${extension}`);
  },
});

const upload = multer({ storage: storage });

router.post("/naqlee-user", upload.single("userPhoto"), async (req, res) => {
  try {
    // Create user first
    const userId = await createNaqleeUser(req, res); // Create user without photo

    // Check if file is uploaded
    if (!req.file) { // Added this check
      return res.status(400).json({ success: false, message: "User photo is required." });
    }

    // Update the user with the photo details
    await updateNaqleeUserPhoto(userId, req.file); // Update user with photo

    res.status(201).json({ success: true, message: "NaqleeUser created successfully" });
  } catch (error) {
    console.error("Error creating NaqleeUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/getAllNaqleeUsers', getAllNaqleeUsers);
router.get('/getNaqleeUserById', getNaqleeUserById);
router.delete('/deleteNaqleeUser/:id', deleteNaqleeUser);
router.put('/updateNaqleeUser/:id', upload.single('userPhoto'), async(req, res) => {
  try {
    const userId = await updateNaqleeUser(req, res);
    // Check if file is uploaded
    if (!req.file) { // Added this check
      return res.status(400).json({ success: false, message: "User photo is required." });
    }

    // Update the user with the photo details
    await updateNaqleeUserPhoto(userId, req.file); // Update user with photo
    res.json({ success: true, message: 'User updated successfully' });
  }catch (error) {
    console.error("Error updating NaqleeUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
})

router.post('/add-notification', notificationController.addNotification);
router.get('/all-notifications', notificationController.getAllNotifications);
router.put('/update/:notificationId', notificationController.updateNotification);
router.delete('/delete/:notificationId', notificationController.deleteNotification);
router.get('/getNotificationById/:id', notificationController.getNotificationById);
router.post('/create-commission', commissionController.createCommission);
router.get('/getAllCommissions', commissionController.getAllCommissions);

module.exports = router;
