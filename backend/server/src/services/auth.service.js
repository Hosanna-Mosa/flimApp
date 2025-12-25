const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/token');

const OTP_CODE = '123456';

const register = async ({ name, phone, password, roles, industries }) => {
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    const err = new Error('Phone number already registered');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // Auto-generate placeholder email since it is required by model but not asked in form
  const email = `${phone}@placeholder.com`;

  const user = await User.create({
    name,
    phone,
    email,
    password: hashedPassword,
    roles,
    industries,
  });

  const payload = { sub: user.id, roles: user.roles };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshTokens = [refreshToken];
  await user.save();

  return { user, accessToken, refreshToken };
};

const loginWithPassword = async ({ phone, password }) => {
  console.log('[Auth Debug] Looking for user with phone:', phone);
  
  // Try to find all users to debug
  const allUsers = await User.find({}).select('phone email name');
  console.log('[Auth Debug] All users in DB:', allUsers.map(u => ({ 
    phone: u.phone, 
    email: u.email, 
    name: u.name 
  })));
  
  const user = await User.findOne({ phone });
  console.log('[Auth Debug] User found:', user ? { 
    id: user._id, 
    phone: user.phone, 
    email: user.email,
    name: user.name,
    hasPassword: !!user.password 
  } : 'NO USER FOUND');
  
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  console.log('[Auth Debug] Comparing passwords...');
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('[Auth Debug] Password match:', isMatch);
  
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  user.lastLoginAt = new Date();
  const payload = { sub: user.id, roles: user.roles };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshTokens = [refreshToken];
  await user.save();

  return { user, accessToken, refreshToken };
};

const login = async ({ identifier }) => {
  const user =
    (await User.findOne({ email: identifier })) ||
    (await User.findOne({ phone: identifier }));
  return {
    otpSent: true,
    userExists: Boolean(user),
    message: 'OTP sent (mock)',
  };
};

const verifyOtp = async ({ identifier, otp }) => {
  if (otp !== OTP_CODE) {
    const err = new Error('Invalid OTP');
    err.status = 400;
    throw err;
  }

  let user =
    (await User.findOne({ email: identifier })) ||
    (await User.findOne({ phone: identifier }));

  if (!user) {
    const hashed = await bcrypt.hash(identifier, 10);
    user = await User.create({
      name: 'New User',
      email: identifier.includes('@') ? identifier : `${identifier}@film.app`,
      phone: identifier,
      password: hashed,
      roles: ['actor'],
      industries: ['bollywood'],
    });
  }

  user.lastLoginAt = new Date();

  const payload = { sub: user.id, roles: user.roles };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshTokens = [refreshToken];
  await user.save();

  return { user, accessToken, refreshToken };
};

const refresh = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.sub);
  if (!user || !user.refreshTokens.includes(token)) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }
  const payload = { sub: user.id, roles: user.roles };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshTokens = [refreshToken];
  await user.save();
  return { accessToken, refreshToken };
};

const logout = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) return;
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  await user.save();
};

const verifyPassword = async ({ userId, password }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  // If user has no password (e.g. OTP login only), we can't verify
  if (!user.password) {
    const err = new Error('User has no password set');
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Incorrect password');
    err.status = 401;
    throw err;
  }
  return { success: true };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  // Verify current password again for security
  if (user.password) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const err = new Error('Incorrect current password');
      err.status = 401;
      throw err;
    }
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  
  return { success: true, message: 'Password updated successfully' };
};

module.exports = { login, verifyOtp, refresh, logout, register, loginWithPassword, verifyPassword, changePassword };

