const express = require('express');
const supportController = require('../controllers/support.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', auth, supportController.createSupportRequest);

module.exports = router;
