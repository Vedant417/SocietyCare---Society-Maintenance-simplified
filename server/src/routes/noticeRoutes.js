const express = require('express');
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect, restrictToAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createNoticeSchema } = require('../validators/schemas');

const router = express.Router();

router.use(protect);

router.get('/', getNotices);

// Admin-only operations
router.post('/', restrictToAdmin, validate(createNoticeSchema), createNotice);
router.patch('/:id', restrictToAdmin, validate(createNoticeSchema.partial()), updateNotice);
router.delete('/:id', restrictToAdmin, deleteNotice);

module.exports = router;
