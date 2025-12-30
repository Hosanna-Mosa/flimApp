const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.model');
const { fail } = require('../utils/response');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 'Unauthorized', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if it's an admin token
    if (!decoded.isAdmin) {
        return fail(res, 'Forbidden: Admin access only', 403);
    }

    const admin = await Admin.findById(decoded.sub);
    if (!admin) return fail(res, 'Unauthorized', 401);
    
    // Set user info on request (sub is admin ID)
    req.user = {
        sub: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isAdmin: true
    };
    
    return next();
  } catch (err) {
    return fail(res, 'Unauthorized', 401);
  }
};
