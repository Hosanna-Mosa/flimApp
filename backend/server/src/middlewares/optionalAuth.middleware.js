const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't fail if token is missing
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue without authentication
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub);
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    // Invalid token - continue without authentication
    req.user = null;
  }
  
  return next();
};

