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
    const user = await User.findById(decoded.sub);
    if (!user) return fail(res, 'Unauthorized', 401);
    req.user = user;
    return next();
  } catch (err) {
    return fail(res, 'Unauthorized', 401);
  }
};

