const express = require('express');
const adminUserController = require('../controllers/adminUser.controller');
// Assuming there is an admin middleware to protect these routes
// const adminAuth = require('../middlewares/adminAuth.middleware'); 

const router = express.Router();

// router.use(adminAuth); // Enable verification once middleware is confirmed

router.get('/', adminUserController.getAllUsers);
router.put('/:id/suspend', adminUserController.suspendUser);
router.put('/:id/unsuspend', adminUserController.unsuspendUser);

module.exports = router;
