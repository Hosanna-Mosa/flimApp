const VerificationRequest = require('../models/VerificationRequest.model');
const User = require('../models/User.model');
const { success } = require('../utils/response');

const submitRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { verificationType, reason, documents } = req.body;

    // Check if there's already a pending request
    const existingRequest = await VerificationRequest.findOne({ 
      user: userId, 
      status: 'PENDING' 
    });

    if (existingRequest) {
      const err = new Error('You already have a pending verification request');
      err.status = 400;
      throw err;
    }

    const request = await VerificationRequest.create({
      user: userId,
      verificationType,
      reason,
      documents
    });

    // Update user status
    await User.findByIdAndUpdate(userId, { verificationStatus: 'pending_docs' });

    return success(res, request, 201);
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const request = await VerificationRequest.findOne({ user: userId })
      .sort({ createdAt: -1 });

    if (!request) {
      return success(res, { status: 'NONE' });
    }

    return success(res, request);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  getStatus
};
