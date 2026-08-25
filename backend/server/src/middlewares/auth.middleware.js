const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { fail } = require('../utils/response');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Admin tokens are signed with the same secret; they must never satisfy
    // user authentication.
    if (decoded.isAdmin) return fail(res, 'Unauthorized', 401);

    const user = await User.findById(decoded.sub);
    if (!user) return fail(res, 'Unauthorized', 401);

    // Enforce moderation state. Without this, suspending or banning a user in
    // the admin panel has no effect: their existing token keeps working.
    if (user.status === 'banned') {
      return fail(res, 'This account has been permanently banned.', 403);
    }
    if (user.status === 'suspended') {
      const until = user.suspendedUntil;
      if (!until || until > new Date()) {
        return fail(res, 'This account is suspended.', 403);
      }
      // Suspension window elapsed - restore the account.
      user.status = 'active';
      user.suspensionReason = null;
      user.suspendedUntil = null;
      await user.save();
    }

    req.user = user;
    return next();
  } catch (err) {
    return fail(res, 'Unauthorized', 401);
  }
};
