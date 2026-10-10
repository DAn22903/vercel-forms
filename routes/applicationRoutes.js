const express = require('express');
const {
  createApplication,
  listApplications,
  getApplication
} = require('../controllers/applicationController');
const { requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/', createApplication);
router.get('/', requireAdmin, listApplications);
router.get('/:id', requireAdmin, getApplication);

module.exports = router;
