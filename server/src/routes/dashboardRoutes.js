const express = require('express');
const { getDashboardData, getRecurringIssues, getHealthScore } = require('../controllers/dashboardController');
const { protect, restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, restrictToAdmin, getDashboardData);
router.get('/recurring-issues', protect, restrictToAdmin, getRecurringIssues);
router.get('/health-score', protect, restrictToAdmin, getHealthScore);

module.exports = router;
