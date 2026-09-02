const AdminAuditLog = require('../models/AdminAuditLog.model');

/**
 * Canonical action names. Kept in one place so the audit screen can filter on
 * them without matching free text.
 */
const AUDIT_ACTIONS = {
  WALLET_ADJUST: 'WALLET_ADJUST',
  USER_SUSPEND: 'USER_SUSPEND',
  USER_UNSUSPEND: 'USER_UNSUSPEND',
  SUBSCRIPTION_DELETE: 'SUBSCRIPTION_DELETE',
  VERSION_CONFIG_UPDATE: 'VERSION_CONFIG_UPDATE',
  APP_SHUTDOWN_TOGGLE: 'APP_SHUTDOWN_TOGGLE',
  REPORT_ACKNOWLEDGE: 'REPORT_ACKNOWLEDGE',
  REPORT_RESOLVE: 'REPORT_RESOLVE',
  REPORT_ESCALATE: 'REPORT_ESCALATE',
  SUPPORT_REPLY: 'SUPPORT_REPLY',
  SUPPORT_STATUS_CHANGE: 'SUPPORT_STATUS_CHANGE',
  ERROR_RESOLVE: 'ERROR_RESOLVE',
};

/**
 * Write one audit entry.
 *
 * Deliberately never throws: an audit write failing must not roll back or 500 a
 * successful admin action. A failure is logged to the server console instead,
 * which is the same place an operator would look for it.
 */
const recordAudit = async (req, { action, targetType, targetId, targetLabel, summary, meta }) => {
  try {
    await AdminAuditLog.create({
      adminId: req.user.sub,
      adminName: req.user.name,
      adminRole: req.user.role,
      action,
      targetType,
      targetId,
      targetLabel,
      summary,
      meta,
      ip: req.ip,
    });
  } catch (err) {
    console.error('[Audit] Failed to record admin action', action, err);
  }
};

module.exports = { recordAudit, AUDIT_ACTIONS };
