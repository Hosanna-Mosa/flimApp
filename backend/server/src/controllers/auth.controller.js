const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    console.log('[Auth Debug] Login Request:', req.body);
    const result = await authService.login(req.body);
    return success(res, result, 200);
  } catch (err) {
    return next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    console.log('[Auth Debug] Verify OTP Request:', req.body);
    const result = await authService.verifyOtp(req.body);
    return success(res, result, 200);
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return success(res, result, 200);
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, req.body.refreshToken);
    return success(res, { loggedOut: true }, 200);
  } catch (err) {
    return next(err);
  }
};

const register = async (req, res, next) => {
  try {
    console.log('[Auth Debug] Register Request:', req.body);
    const result = await authService.register(req.body);
    return success(res, result, 201);
  } catch (err) {
    return next(err);
  }
};

const loginWithPassword = async (req, res, next) => {
  try {
    console.log('[Auth Debug] Login Password Request:', req.body);
    const result = await authService.loginWithPassword(req.body);
    return success(res, result, 200);
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, verifyOtp, refresh, logout, register, loginWithPassword };

