const Report = require('../models/report.model');
const Post = require('../models/Post.model');
const Comment = require('../models/Comment.model');
const User = require('../models/User.model');
const { success, fail } = require('../utils/response');
const { recordAudit, AUDIT_ACTIONS } = require('../utils/auditLog');
const { createNotification } = require('../services/notification.service');

/**
 * Hours a report may sit before it is considered overdue.
 *
 * Apple expects objectionable content to be actioned within 24 hours, and the
 * IT Rules expect a grievance acknowledged in the same window, so one number
 * serves both. Reports are surfaced as overdue at 24h and approaching from 18h.
 */
const SLA_HOURS = 24;
const SLA_WARNING_HOURS = 18;

const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / 36e5;

const slaFor = (report) => {
  if (report.status === 'resolved') return { state: 'done', hoursOpen: null };
  const hoursOpen = hoursSince(report.createdAt);
  let state = 'ok';
  if (hoursOpen >= SLA_HOURS) state = 'overdue';
  else if (hoursOpen >= SLA_WARNING_HOURS) state = 'due_soon';
  return { state, hoursOpen: Math.floor(hoursOpen) };
};

/** Load whatever a report points at, plus the user accountable for it. */
const loadTarget = async (report) => {
  if (report.type === 'post') {
    const post = await Post.findById(report.targetId)
      .select('caption type mediaUrl media isActive author createdAt')
      .populate('author', 'name username avatar status');
    if (!post) return { missing: true };
    return {
      kind: 'post',
      id: post._id,
      preview: post.caption || `(${post.type} with no caption)`,
      mediaUrl: post.mediaUrl || post.media?.url || null,
      isActive: post.isActive,
      createdAt: post.createdAt,
      owner: post.author,
    };
  }

  if (report.type === 'comment') {
    // Comment stores its author on `user` and its body on `content`, unlike
    // Post which uses `author`/`caption`.
    const comment = await Comment.findById(report.targetId)
      .select('content isActive user post createdAt')
      .populate('user', 'name username avatar status');
    if (!comment) return { missing: true };
    return {
      kind: 'comment',
      id: comment._id,
      preview: comment.content || '(empty comment)',
      isActive: comment.isActive,
      createdAt: comment.createdAt,
      postId: comment.post,
      owner: comment.user,
    };
  }

  const user = await User.findById(report.targetId).select('name username avatar status bio');
  if (!user) return { missing: true };
  return {
    kind: 'user',
    id: user._id,
    preview: user.bio || '(no bio)',
    isActive: user.status === 'active',
    owner: user,
  };
};

/**
 * GET /admin/reports — the queue.
 *
 * Defaults to open reports oldest first, because the oldest report is the one
 * closest to breaching. Sorting newest-first would bury exactly what matters.
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'open', type, sla } = req.query;

    const query = {};
    if (status === 'open') query.status = { $in: ['pending', 'reviewed'] };
    else if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const perPage = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * perPage;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(perPage)
        .populate('reporterId', 'name username avatar'),
      Report.countDocuments(query),
    ]);

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const [target, duplicateCount] = await Promise.all([
          loadTarget(report),
          Report.countDocuments({ targetId: report.targetId, _id: { $ne: report._id } }),
        ]);
        return {
          ...report.toObject(),
          sla: slaFor(report),
          target,
          otherReportsOnTarget: duplicateCount,
        };
      })
    );

    const filtered = sla && sla !== 'all'
      ? enriched.filter((r) => r.sla.state === sla)
      : enriched;

    return success(res, {
      data: filtered,
      total,
      page: parseInt(page, 10) || 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/reports/stats — queue depth for the dashboard header. */
const getReportStats = async (req, res, next) => {
  try {
    const open = { status: { $in: ['pending', 'reviewed'] } };
    const overdueBefore = new Date(Date.now() - SLA_HOURS * 36e5);

    const [pending, reviewed, resolved, overdue, oldest] = await Promise.all([
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewed' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ ...open, createdAt: { $lt: overdueBefore } }),
      Report.findOne(open).sort({ createdAt: 1 }).select('createdAt'),
    ]);

    return success(res, {
      pending,
      reviewed,
      resolved,
      open: pending + reviewed,
      overdue,
      oldestOpenAgeHours: oldest ? Math.floor(hoursSince(oldest.createdAt)) : null,
      slaHours: SLA_HOURS,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/reports/:id — one report with everything needed to judge it. */
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterId', 'name username avatar email')
      .populate('reviewedBy', 'name email');
    if (!report) return fail(res, 'Report not found', 404);

    const [target, others] = await Promise.all([
      loadTarget(report),
      Report.find({ targetId: report.targetId, _id: { $ne: report._id } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('reporterId', 'name username avatar'),
    ]);

    return success(res, {
      ...report.toObject(),
      sla: slaFor(report),
      target,
      otherReports: others,
    });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/reports/:id/acknowledge — pending to reviewed, starts the clock record. */
const acknowledgeReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return fail(res, 'Report not found', 404);
    if (report.status === 'resolved') return fail(res, 'Report is already resolved', 400);

    report.status = 'reviewed';
    report.reviewedBy = req.user.sub;
    report.reviewedByName = req.user.name;
    report.reviewedAt = new Date();
    await report.save();

    await recordAudit(req, {
      action: AUDIT_ACTIONS.REPORT_ACKNOWLEDGE,
      targetType: 'Report',
      targetId: report._id,
      summary: `Acknowledged ${report.type} report opened ${Math.floor(hoursSince(report.createdAt))}h ago`,
      meta: { reason: report.reason, reportedTarget: report.targetId },
    });

    return success(res, report);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /admin/reports/:id/resolve — take an action and close the report.
 *
 * Every branch resolves the report, including 'no_action'; a report that has
 * been looked at and judged fine still has to leave the queue, or the queue
 * stops meaning "needs a human".
 */
const resolveReport = async (req, res, next) => {
  try {
    const { resolution, notes, suspensionDays } = req.body;

    const allowed = ['content_removed', 'user_warned', 'user_suspended', 'no_action'];
    if (!allowed.includes(resolution)) {
      return fail(res, `resolution must be one of: ${allowed.join(', ')}`, 400);
    }

    const report = await Report.findById(req.params.id);
    if (!report) return fail(res, 'Report not found', 404);
    if (report.status === 'resolved') return fail(res, 'Report is already resolved', 400);

    const target = await loadTarget(report);
    if (target.missing) {
      // The content is already gone. Close the report rather than stranding it.
      report.status = 'resolved';
      report.resolution = 'no_action';
      report.adminNotes = notes || 'Reported content no longer exists.';
      report.reviewedBy = req.user.sub;
      report.reviewedByName = req.user.name;
      report.reviewedAt = new Date();
      await report.save();
      return success(res, { report, note: 'Target no longer exists; closed with no action.' });
    }

    const ownerId = target.owner?._id;
    const ownerName = target.owner?.name || 'the user';
    let outcome = '';

    if (resolution === 'content_removed') {
      if (report.type === 'post') {
        await Post.findByIdAndUpdate(report.targetId, { isActive: false });
      } else if (report.type === 'comment') {
        await Comment.findByIdAndUpdate(report.targetId, { isActive: false });
      } else {
        return fail(res, 'Use user_suspended for a reported user, not content_removed', 400);
      }
      outcome = `Removed reported ${report.type} by ${ownerName}`;

      if (ownerId) {
        await createNotification({
          user: ownerId,
          title: 'Your content was removed',
          body: `Your ${report.type} was removed because it broke the FilmyConnect community rules.`,
          type: 'moderation',
          metadata: { reportId: report._id.toString(), action: 'content_removed' },
        });
      }
    }

    if (resolution === 'user_warned') {
      outcome = `Warned ${ownerName}`;
      if (ownerId) {
        await createNotification({
          user: ownerId,
          title: 'Community rules warning',
          body: 'Something you posted was reported and reviewed. Please follow the community rules — repeated issues can lead to your account being suspended.',
          type: 'moderation',
          metadata: { reportId: report._id.toString(), action: 'user_warned' },
        });
      }
    }

    if (resolution === 'user_suspended') {
      if (!ownerId) return fail(res, 'Cannot suspend — no account attached to this report', 400);

      const update = { status: 'suspended', suspensionReason: notes || 'Community rules violation' };
      const days = parseInt(suspensionDays, 10);
      if (days > 0) {
        const until = new Date();
        until.setDate(until.getDate() + days);
        update.suspendedUntil = until;
      }
      await User.findByIdAndUpdate(ownerId, update);
      outcome = `Suspended ${ownerName}${days > 0 ? ` for ${days} days` : ' indefinitely'}`;

      await createNotification({
        user: ownerId,
        title: 'Your account has been suspended',
        body: days > 0
          ? `Your account is suspended for ${days} days following a review of reported content.`
          : 'Your account has been suspended following a review of reported content.',
        type: 'moderation',
        metadata: { reportId: report._id.toString(), action: 'user_suspended' },
      });
    }

    if (resolution === 'no_action') {
      outcome = `Reviewed and closed with no action`;
    }

    report.status = 'resolved';
    report.resolution = resolution;
    report.adminNotes = notes;
    report.reviewedBy = req.user.sub;
    report.reviewedByName = req.user.name;
    report.reviewedAt = new Date();
    await report.save();

    // Other open reports about the same thing are answered by the same decision.
    let alsoClosed = 0;
    if (resolution !== 'no_action') {
      const result = await Report.updateMany(
        { targetId: report.targetId, status: { $in: ['pending', 'reviewed'] } },
        {
          status: 'resolved',
          resolution,
          adminNotes: `Closed with report ${report._id}`,
          reviewedBy: req.user.sub,
          reviewedByName: req.user.name,
          reviewedAt: new Date(),
        }
      );
      alsoClosed = result.modifiedCount || 0;
    }

    await recordAudit(req, {
      action: AUDIT_ACTIONS.REPORT_RESOLVE,
      targetType: 'Report',
      targetId: report._id,
      targetLabel: ownerName,
      summary: outcome + (alsoClosed ? ` (also closed ${alsoClosed} duplicate report${alsoClosed === 1 ? '' : 's'})` : ''),
      meta: {
        resolution,
        notes,
        reportType: report.type,
        reportedTarget: report.targetId,
        contentOwner: ownerId,
        hoursToResolve: Math.floor(hoursSince(report.createdAt)),
        duplicatesClosed: alsoClosed,
      },
    });

    return success(res, { report, outcome, duplicatesClosed: alsoClosed });
  } catch (err) {
    next(err);
  }
};

/** POST /admin/reports/:id/escalate — hand a hard case to a super admin. */
const escalateReport = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return fail(res, 'Report not found', 404);
    if (report.status === 'resolved') return fail(res, 'Report is already resolved', 400);

    report.status = 'reviewed';
    report.resolution = 'escalated';
    report.adminNotes = notes;
    report.escalatedAt = new Date();
    report.reviewedBy = req.user.sub;
    report.reviewedByName = req.user.name;
    report.reviewedAt = new Date();
    await report.save();

    await recordAudit(req, {
      action: AUDIT_ACTIONS.REPORT_ESCALATE,
      targetType: 'Report',
      targetId: report._id,
      summary: `Escalated ${report.type} report to super admin${notes ? ` — ${notes}` : ''}`,
      meta: { reason: report.reason, notes, reportedTarget: report.targetId },
    });

    return success(res, report);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  getReportStats,
  getReportById,
  acknowledgeReport,
  resolveReport,
  escalateReport,
};
