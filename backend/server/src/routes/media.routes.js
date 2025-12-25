const express = require('express');
const MediaController = require('../controllers/media.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

// Generate upload signature (authenticated users only)
router.post('/signature', auth, MediaController.generateSignature);

// Validate uploaded media
router.post('/validate', auth, MediaController.validateMedia);

// Delete media (authenticated users only)
router.delete('/:publicId', auth, MediaController.deleteMedia);

module.exports = router;
