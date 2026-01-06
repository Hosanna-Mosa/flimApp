const VerificationRequest = require('../models/VerificationRequest.model');
const VerificationLog = require('../models/VerificationLog.model');
const Subscription = require('../models/Subscription.model');
const User = require('../models/User.model');
const { success } = require('../utils/response');
const { sendVerificationApproved, sendVerificationRejected } = require('../services/mail.service');

const getRequests = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      name, 
      role, 
      phone, 
      industry 
    } = req.query;
    
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Handle user-based filters
    if (name || role || phone || industry) {
      const userQuery = {};
      if (name) userQuery.name = { $regex: name, $options: 'i' };
      if (role) userQuery.roles = role;
      if (phone) userQuery.phone = { $regex: phone, $options: 'i' };
      if (industry) userQuery.industries = industry;

      const matchingUsers = await User.find(userQuery).select('_id');
      const userIds = matchingUsers.map(u => u._id);
      query.user = { $in: userIds };
    }

    const total = await VerificationRequest.countDocuments(query);
    const requests = await VerificationRequest.find(query)
      .populate('user', 'name email phone avatar isVerified roles industries')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Map to the expected structure in the admin panel
    const formattedRequests = requests.map(req => ({
      id: req._id,
      userId: req.user?._id,
      user: {
        id: req.user?._id,
        name: req.user?.name,
        email: req.user?.email,
        phone: req.user?.phone,
        avatar: req.user?.avatar,
        isVerified: req.user?.isVerified,
        roles: req.user?.roles,
        industries: req.user?.industries,
      },
      verificationType: req.verificationType,
      status: req.status,
      reason: req.reason,
      documents: req.documents.map(doc => ({
        id: doc._id,
        type: doc.type,
        url: doc.url,
        name: doc.name
      })),
      adminNotes: req.adminNotes,
      submittedAt: req.createdAt,
      reviewedAt: req.reviewedAt,
      reviewedBy: req.reviewedBy,
    }));

    return success(res, {
      data: formattedRequests,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('user', 'name email phone avatar isVerified roles industries bio createdAt');
      
    if (!request) {
      const err = new Error('Request not found');
      err.status = 404;
      throw err;
    }

    return success(res, {
      id: request._id,
      userId: request.user?._id,
      user: {
        id: request.user?._id,
        name: request.user?.name,
        email: request.user?.email,
        phone: request.user?.phone,
        avatar: request.user?.avatar,
        role: request.user?.roles?.[0] || 'USER',
        roles: request.user?.roles,
        industries: request.user?.industries,
        bio: request.user?.bio,
        isVerified: request.user?.isVerified,
        createdAt: request.user?.createdAt,
      },
      verificationType: request.verificationType,
      status: request.status,
      reason: request.reason,
      documents: request.documents.map(doc => ({
        id: doc._id,
        type: doc.type,
        url: doc.url,
        name: doc.name
      })),
      adminNotes: request.adminNotes,
      submittedAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
    });
  } catch (err) {
    next(err);
  }
};

const approve = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.sub;
    const adminName = req.user.name || 'Admin';

    // Find the latest request regardless of status to allow "re-approving"
    const request = await VerificationRequest.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!request) {
      const err = new Error('No verification request found for this user');
      err.status = 404;
      throw err;
    }

    // Update request
    request.status = 'APPROVED';
    request.adminNotes = notes;
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    await request.save();

    // Update user
    const user = await User.findById(userId);
    console.log(`[Admin Verification] Approving user: ${userId}, found: ${!!user}`);
    
    if (user) {
      user.verificationStatus = 'approved_docs';
      // user.isVerified remains false until payment
      console.log(`[Admin Verification] Updating user ${userId} status to approved_docs`);
      await user.save();
    } else {
      console.error(`[Admin Verification] User not found: ${userId}`);
    }

    // Log action
    await VerificationLog.create({
      userId: user?._id,
      userName: user?.name,
      userAvatar: user?.avatar,
      action: 'APPROVE',
      adminId,
      adminName,
      notes
    });

    // Notify user
    if (user && user.email) {
      sendVerificationApproved(user, notes).catch(err => console.error('Failed to send approval email:', err));
    }

    return success(res, { message: 'Verification approved' });
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.sub;
    const adminName = req.user.name || 'Admin';

    const request = await VerificationRequest.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!request) {
       const err = new Error('No verification request found for this user');
       err.status = 404;
       throw err;
    }

    // Update request
    request.status = 'REJECTED';
    request.adminNotes = notes;
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    await request.save();

    // Update user
    const user = await User.findById(userId);
    console.log(`[Admin Verification] Rejecting user: ${userId}, found: ${!!user}`);
    
    if (user) {
      user.verificationStatus = 'rejected';
      user.isVerified = false;
      console.log(`[Admin Verification] Updating user ${userId} status to rejected`);
      await user.save();
    } else {
      console.error(`[Admin Verification] User not found: ${userId}`);
    }

    // Log action
    await VerificationLog.create({
      userId: user?._id,
      userName: user?.name,
      userAvatar: user?.avatar,
      action: 'REJECT',
      adminId,
      adminName,
      notes
    });

    // Notify user
    if (user && user.email) {
      sendVerificationRejected(user, notes).catch(err => console.error('Failed to send rejection email:', err));
    }

    return success(res, { message: 'Verification rejected' });
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userName, action } = req.query;
    const query = {};
    if (userName) query.userName = { $regex: userName, $options: 'i' };
    if (action && action !== 'ALL') query.action = action;
    
    const total = await VerificationLog.countDocuments(query);
    const logs = await VerificationLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const formattedLogs = logs.map(log => ({
      id: log._id,
      userId: log.userId,
      userName: log.userName,
      userAvatar: log.userAvatar,
      action: log.action,
      adminId: log.adminId,
      adminName: log.adminName,
      notes: log.notes,
      timestamp: log.timestamp
    }));

    return success(res, {
      data: formattedLogs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, name } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (name) {
      const matchingUsers = await User.find({ name: { $regex: name, $options: 'i' } }).select('_id');
      query.user = { $in: matchingUsers.map(u => u._id) };
    }

    const total = await Subscription.countDocuments(query);
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email avatar verificationStatus isVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub._id,
      userId: sub.user?._id,
      user: {
        id: sub.user?._id,
        name: sub.user?.name,
        email: sub.user?.email,
        avatar: sub.user?.avatar,
        verificationStatus: sub.user?.verificationStatus,
        isVerified: sub.user?.isVerified
      },
      planType: sub.planType,
      amount: sub.amount,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      razorpayOrderId: sub.razorpayOrderId,
      razorpayPaymentId: sub.razorpayPaymentId,
      createdAt: sub.createdAt
    }));

    return success(res, {
      data: formattedSubscriptions,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Subscription.findByIdAndDelete(id);
    return success(res, { message: 'Subscription record deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRequests,
  getRequestById,
  approve,
  reject,
  getLogs,
  getSubscriptions,
  deleteSubscription
};
