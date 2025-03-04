const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const forgotPassword = require("../controller/forgetPasswordController");
const userRegisterValidation = require('../middlewares/createAccountMiddleware');
const userLoginValidation = require("../middlewares/userLoginValidation");
const forgotPasswordValidation = require("../middlewares/forgetPasswordValidation");
const userLogin = require("../controller/userLogin");
const { protect } = require("../middlewares/authMiddleware");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');

// Set up the storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/userProfile');  
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      const extension = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${extension}`);  
    },
  });

const upload = multer({ storage: storage });

router.post('/register', userRegisterValidation, userController.userRegister);
router.post('/verify-otp', userController.verifyOTP);
router.post('/resend-otp', userController.resendOTP);
router.post('/login', userLoginValidation, userLogin);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword.forgotPassword);
router.post('/verify-otp-update-password', forgotPassword.verifyOTPAndUpdatePassword);
router.get('/users/:id', userController.getUserById);
router.get('/users', userController.getAllUsers);
router.put('/users/:id/status', userController.updateUserStatus);
router.put('/users/edit-profile/:userId', protect, upload.single('userProfile'), userController.editUser);
router.delete('/deleteUser', protect, userController.deleteUser);

module.exports = router;