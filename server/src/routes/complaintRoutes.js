const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  updateComplaintPriority,
  checkDuplicates,
  submitSatisfaction,
  reopenComplaint,
  deleteComplaint,
  updateComplaint,
  getComplaintPhoto,
} = require('../controllers/complaintController');
const { protect, restrictToAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  createComplaintSchema,
  updateStatusSchema,
  updatePrioritySchema,
} = require('../validators/schemas');

const router = express.Router();

// All complaint routes require authentication
router.use(protect);

router.post(
  '/',
  upload.single('photo'),
  // Manual check for JSON parsing body when multipart/form-data is uploaded,
  // Zod validation should run after Multer processes req.body
  validate(createComplaintSchema),
  createComplaint
);

// Duplicate check (resident only - before submitting a complaint)
router.post('/check-duplicate', checkDuplicates);

router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.get('/:id/photo', getComplaintPhoto);

// Admin-only updates
router.patch(
  '/:id/status',
  restrictToAdmin,
  validate(updateStatusSchema),
  updateComplaintStatus
);

router.patch(
  '/:id/priority',
  restrictToAdmin,
  validate(updatePrioritySchema),
  updateComplaintPriority
);

// Resident satisfaction rating (after resolution)
router.patch('/:id/satisfaction', submitSatisfaction);

// Resident reopen (after resolution)
router.patch('/:id/reopen', reopenComplaint);

// Resident update (category, description only)
router.patch('/:id', updateComplaint);

// Resident delete
router.delete('/:id', deleteComplaint);

module.exports = router;
