const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, restrictToAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateSettingsSchema } = require('../validators/schemas');

const router = express.Router();

router.use(protect);
router.use(restrictToAdmin);

router.get('/', getSettings);
router.patch('/', validate(updateSettingsSchema), updateSettings);

module.exports = router;
