const Admin = require('../models/Admin.model');
const { generateAccessToken } = require('../utils/token');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const payload = { 
      sub: admin.id, 
      role: admin.role,
      isAdmin: true 
    };
    const accessToken = generateAccessToken(payload);

    return success(res, {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

const validateToken = async (req, res, next) => {
  try {
    // Middleware will have already validated the token
    return success(res, { valid: true });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // Standard stateless JWT logout
    return success(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  validateToken,
  logout
};
