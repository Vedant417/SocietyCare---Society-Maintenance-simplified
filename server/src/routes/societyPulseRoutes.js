const express = require('express');
const { getSocietyPulse, updateSocietyPulse } = require('../controllers/societyPulseController');
const { protect, restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getSocietyPulse);
router.patch('/', protect, restrictToAdmin, updateSocietyPulse);

module.exports = router;
