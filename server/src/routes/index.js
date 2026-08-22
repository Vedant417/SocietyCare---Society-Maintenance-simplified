const express = require('express');
const authRoutes = require('./authRoutes');
const complaintRoutes = require('./complaintRoutes');
const noticeRoutes = require('./noticeRoutes');
const settingsRoutes = require('./settingsRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const residentRoutes = require('./residentRoutes');
const notificationRoutes = require('./notificationRoutes');
const familyMemberRoutes = require('./familyMemberRoutes');
const weatherRoutes = require('./weatherRoutes');
const societyPulseRoutes = require('./societyPulseRoutes');

const router = express.Router();

// Register routers
router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/notices', noticeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/family-members', familyMemberRoutes);
router.use('/weather', weatherRoutes);
router.use('/society-pulse', societyPulseRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/dashboard', dashboardRoutes);
router.use('/admin/residents', residentRoutes);

module.exports = router;
