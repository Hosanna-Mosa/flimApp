const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't fail if no token
 */
module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // If no auth header, just continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.sub);
        if (user) {
            req.user = user;
        }
    } catch (err) {
        // Invalid token, but we don't fail - just continue without user
        console.log('Optional auth: Invalid token, continuing without user');
    }

    return next();
};
