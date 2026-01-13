const { client, VERIFY_SERVICE_SID } = require('../../config/twilio');
const User = require('../../models/User.model');
const { generateAccessToken, generateRefreshToken } = require('../../utils/token');
const { success, fail } = require('../../utils/response');
const bcrypt = require('bcryptjs');

/**
 * Send OTP via Twilio Verify
 * POST /auth/send-otp
 */
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return fail(res, 'Phone number is required', 400);
    }

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });

    console.log(`[Twilio] OTP sent to ${phone}, SID: ${verification.sid}`);

    return success(res, { message: 'OTP sent' });
  } catch (error) {
    console.error('[Twilio Error] Send OTP:', error);
    // Handle specific Twilio errors if needed
    // Handle specific Twilio errors
    if (error.code === 60200 || error.code === 21211) {
      return fail(res, 'Invalid phone number format. Please use E.164 format (e.g. +1234567890)', 400);
    }
    return next(error);
  }
};

/**
 * Verify OTP and handle User login/registration
 * POST /auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return fail(res, 'Phone and OTP are required', 400);
    }

    let verificationCheck;
    try {
      verificationCheck = await client.verify.v2
        .services(VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: otp });
    } catch (vError) {
      if (vError.code === 20404 || vError.status === 404) {
        return fail(res, 'OTP expired or not found. Please request a new one.', 404);
      }
      throw vError;
    }

    if (verificationCheck.status !== 'approved') {
      return fail(res, 'Invalid OTP', 401);
    }

    // OTP Approved, find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      // Logic for new user registration during OTP verification
      // Check if registration details are provided
      const { name, email, password } = req.body;
      
      let finalPassword = password;
      if (!finalPassword) {
         // Fallback if no password provided (e.g. login flow with just OTP), create random/hash
         finalPassword = await bcrypt.hash(phone + Date.now(), 10);
      } else {
         finalPassword = await bcrypt.hash(password, 10);
      }

      user = await User.create({
        name: name || 'New User',
        phone,
        email: email || `${phone.replace('+', '')}@flim.app`,
        password: finalPassword,
        roles: ['actor'], // Default role, user can update later
        industries: ['bollywood'], // Default industry
        isVerified: true, // Phone verified
      });
      console.log(`[Auth] New user created for phone: ${phone}`);
    } else {
       // Existing user - ensure isVerified matches reality if we just did OTP
       if (!user.isVerified) {
         user.isVerified = true;
         await user.save();
       }
    }

    // Update login info
    user.lastLoginAt = new Date();
    
    // Generate Tokens
    const payload = { sub: user.id, roles: user.roles };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    return success(res, {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        industries: user.industries
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('[Twilio Error] Verify OTP:', error);
    // Specific Twilio error for expired/invalid
    if (error.code === 20404) {
      return fail(res, 'OTP expired or not found', 404);
    }
    return next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
