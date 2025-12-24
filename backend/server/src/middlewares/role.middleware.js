const { fail } = require('../utils/response');

const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const hasRole = req.user.roles.some((role) => roles.includes(role));
  if (!hasRole) return fail(res, 'Forbidden', 403);
  return next();
};

module.exports = requireRole;

