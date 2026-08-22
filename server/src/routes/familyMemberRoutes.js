const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFamilyMembers, addFamilyMember, deleteFamilyMember } = require('../controllers/familyMemberController');

router.use(protect); // All routes require auth

router.get('/', getFamilyMembers);
router.post('/', addFamilyMember);
router.delete('/:id', deleteFamilyMember);

module.exports = router;
