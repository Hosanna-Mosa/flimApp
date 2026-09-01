const AdminAuditLog = require('../models/AdminAuditLog.model');
const { success } = require('../utils/response');
const { AUDIT_ACTIONS } = require('../utils/auditLog');

/**
 * GET /admin/audit — the platform-wide admin action trail.
 *
 * VerificationLog remains the detailed record of approve/reject decisions; this
 * covers everything else, which previously went unrecorded.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, action, adminId, targetId } = req.query;

    const query = {};
    if (action && action !== 'all') query.action = action;
    if (adminId) query.adminId = adminId;
    if (targetId) query.targetId = targetId;

    const perPage = Math.min(parseInt(limit, 10) || 25, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * perPage;

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      AdminAuditLog.countDocuments(query),
    ]);

    return success(res, {
      data: logs,
      total,
      page: parseInt(page, 10) || 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
      actions: Object.values(AUDIT_ACTIONS),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
