const express = require('express');
const { getWeather, searchLocations } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Weather endpoints require JWT authentication
router.get('/', protect, getWeather);
router.get('/search', protect, searchLocations);

module.exports = router;
