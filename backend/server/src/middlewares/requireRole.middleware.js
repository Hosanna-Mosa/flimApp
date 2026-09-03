const { fail } = require('../utils/response');
const { ADMIN_ROLES } = require('../constants/adminRoles');

/**
 * Route guard for admin roles. Runs after adminAuth.middleware, which is what
 * puts `role` on req.user — this middleware is the piece that actually reads it.
 *
 * SUPER_ADMIN passes every check without being listed, so a route only ever
 * names the roles *below* super that should reach it:
 *
 *   router.put('/:id/wallet', requireRole(), ...)                  // super only
 *   router.put('/:id/suspend', requireRole(ADMIN_ROLES.OPERATIONS), ...)
 *
 * Calling it with no arguments is therefore the super-only case, and is written
 * that way on purpose so the restrictive option is also the shortest.
 */
const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return fail(res, 'Forbidden: Admin access only', 403);
  }

  if (req.user.role === ADMIN_ROLES.SUPER) return next();

  if (!allowed.includes(req.user.role)) {
    return fail(res, 'Forbidden: your admin role cannot perform this action', 403);
  }

  return next();
};

module.exports = requireRole;
