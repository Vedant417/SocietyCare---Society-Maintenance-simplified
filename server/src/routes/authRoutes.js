const express = require('express');
const { register, login, getMe, updateProfile, logout, getUserAvatar, updateWeatherLocation } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
// Serve custom uploaded avatar from GridFS (fileId passed as query param)
router.get('/avatar', protect, getUserAvatar);
router.patch('/profile', protect, upload.single('photo'), updateProfile);
router.patch('/weather-location', protect, updateWeatherLocation);
router.post('/logout', protect, logout);

module.exports = router;
