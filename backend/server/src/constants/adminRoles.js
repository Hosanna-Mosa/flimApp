/**
 * Admin role identifiers.
 *
 * These strings are persisted on Admin.role, so they must not be renamed
 * without a migration over the existing documents.
 *
 * The hierarchy is deliberately flat rather than numeric: a route names the
 * roles it accepts, and SUPER_ADMIN is granted everything implicitly by
 * requireRole. See middlewares/requireRole.middleware.js.
 */
const ADMIN_ROLES = {
  /** Reviews identity documents. Nothing else. */
  VERIFICATION: 'VERIFICATION_ADMIN',
  /** Day-to-day queue work: reports, moderation, support, suspensions. */
  OPERATIONS: 'OPERATIONS_ADMIN',
  /** Money, permissions, platform config, anything irreversible. */
  SUPER: 'SUPER_ADMIN',
};

const ALL_ADMIN_ROLES = Object.values(ADMIN_ROLES);

module.exports = { ADMIN_ROLES, ALL_ADMIN_ROLES };
