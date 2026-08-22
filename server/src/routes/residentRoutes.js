const express = require('express');
const { getResidents } = require('../controllers/residentController');
const { protect, restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictToAdmin, getResidents);

module.exports = router;
