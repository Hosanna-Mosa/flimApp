const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/token');

const OTP_CODE = '123456';

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
      email: identifier.includes('@') ? identifier : `${identifier}@filmy.app`,
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

module.exports = { login, verifyOtp, refresh, logout };

