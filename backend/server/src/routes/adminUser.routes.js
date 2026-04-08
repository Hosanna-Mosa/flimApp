const express = require('express');
const adminUserController = require('../controllers/adminUser.controller');
const adminAuth = require('../middlewares/adminAuth.middleware');

const router = express.Router();

router.use(adminAuth);

router.get('/', adminUserController.getAllUsers);
router.get('/:id', adminUserController.getUserById);
router.put('/:id/wallet', adminUserController.updateWallet);
router.put('/:id/suspend', adminUserController.suspendUser);
router.put('/:id/unsuspend', adminUserController.unsuspendUser);

module.exports = router;
