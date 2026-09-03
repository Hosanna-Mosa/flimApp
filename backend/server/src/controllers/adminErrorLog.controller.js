const ErrorLog = require('../models/ErrorLog.model');
const { success, fail } = require('../utils/response');
const { recordAudit, AUDIT_ACTIONS } = require('../utils/auditLog');

/** GET /admin/errors — grouped faults, most recently seen first. */
const getErrors = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status = 'open', search } = req.query;

    const query = {};
    if (status === 'open') query.resolved = false;
    else if (status === 'resolved') query.resolved = true;

    if (search) {
      // Escaped so a stray bracket in a pasted stack trace cannot throw.
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'i');
      query.$or = [{ message: re }, { name: re }, { path: re }];
    }

    const perPage = Math.min(parseInt(limit, 10) || 25, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * perPage;

    const [errors, total] = await Promise.all([
      ErrorLog.find(query)
        // The stack is large and only the detail view needs it.
        .select('-stack')
        .sort({ lastSeenAt: -1 })
        .skip(skip)
        .limit(perPage)
        .populate('lastUserId', 'name email'),
      ErrorLog.countDocuments(query),
    ]);

    return success(res, {
      data: errors,
      total,
      page: parseInt(page, 10) || 1,
      limit: perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/errors/stats */
const getErrorStats = async (req, res, next) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 36e5);
    const weekAgo = new Date(Date.now() - 7 * 24 * 36e5);

    const [open, resolved, last24h, last7d, occurrences] = await Promise.all([
      ErrorLog.countDocuments({ resolved: false }),
      ErrorLog.countDocuments({ resolved: true }),
      ErrorLog.countDocuments({ lastSeenAt: { $gte: dayAgo } }),
      ErrorLog.countDocuments({ lastSeenAt: { $gte: weekAgo } }),
      ErrorLog.aggregate([{ $group: { _id: null, total: { $sum: '$count' } } }]),
    ]);

    return success(res, {
      open,
      resolved,
      last24h,
      last7d,
      totalOccurrences: occurrences[0]?.total || 0,
      retentionDays: 30,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/errors/:id — the full stack. */
const getErrorById = async (req, res, next) => {
  try {
    const error = await ErrorLog.findById(req.params.id).populate('lastUserId', 'name email avatar');
    if (!error) return fail(res, 'Error not found', 404);
    return success(res, error);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /admin/errors/:id/resolve — tick it off once it is fixed.
 *
 * Not a delete: recordError clears the flag if the fault happens again, so a
 * premature tick corrects itself rather than hiding a live problem.
 */
const resolveError = async (req, res, next) => {
  try {
    const { resolved = true } = req.body;

    const error = await ErrorLog.findById(req.params.id);
    if (!error) return fail(res, 'Error not found', 404);

    error.resolved = !!resolved;
    error.resolvedBy = resolved ? req.user.sub : undefined;
    error.resolvedByName = resolved ? req.user.name : undefined;
    error.resolvedAt = resolved ? new Date() : undefined;
    await error.save();

    await recordAudit(req, {
      action: AUDIT_ACTIONS.ERROR_RESOLVE,
      targetType: 'ErrorLog',
      targetId: error._id,
      targetLabel: error.name,
      summary: `${resolved ? 'Marked fixed' : 'Reopened'}: ${error.name} on ${error.method} ${error.path}`,
      meta: { fingerprint: error.fingerprint, count: error.count },
    });

    return success(res, error);
  } catch (err) {
    next(err);
  }
};

module.exports = { getErrors, getErrorStats, getErrorById, resolveError };
