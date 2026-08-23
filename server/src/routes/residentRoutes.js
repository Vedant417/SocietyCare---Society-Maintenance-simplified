const express = require('express');
const { getResidents, updateResidentApartment } = require('../controllers/residentController');
const { protect, restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictToAdmin, getResidents);
router.patch('/:id/apartment', protect, restrictToAdmin, updateResidentApartment);

module.exports = router;
