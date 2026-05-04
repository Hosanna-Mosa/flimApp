const User = require('../models/user.model');
const Report = require('../models/report.model');

exports.reportContent = async (req, res) => {
  try {
    const { type, targetId, reason } = req.body;
    const reporterId = req.user._id;

    if (!type || !targetId) {
      return res.status(400).json({ success: false, message: 'Type and targetId are required' });
    }

    const report = new Report({
      reporterId,
      type,
      targetId,
      reason: reason || 'inappropriate'
    });

    await report.save();

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('[ModerationController] Report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;
    const userId = req.user._id;

    if (!blockedUserId) {
      return res.status(400).json({ success: false, message: 'blockedUserId is required' });
    }

    if (userId.toString() === blockedUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: blockedUserId }
    });

    res.status(200).json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('[ModerationController] Block error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { unblockedUserId } = req.body;
    const userId = req.user._id;

    if (!unblockedUserId) {
      return res.status(400).json({ success: false, message: 'unblockedUserId is required' });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: unblockedUserId }
    });

    res.status(200).json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('[ModerationController] Unblock error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('blockedUsers');
    
    res.status(200).json({ success: true, blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    console.error('[ModerationController] GetBlocked error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
