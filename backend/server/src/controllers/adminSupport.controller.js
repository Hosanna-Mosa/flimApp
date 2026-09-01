const Support = require('../models/Support.model');
const User = require('../models/User.model');
const { success, fail } = require('../utils/response');
const { recordAudit, AUDIT_ACTIONS } = require('../utils/auditLog');
const { createNotification } = require('../services/notification.service');
const { sendEmail } = require('../services/mail.service');

/**
 * Targets for a support ticket.
 *
 * A help request can also be a grievance under India's IT Rules 2021, which
 * expect acknowledgement within 24 hours and resolution within 15 days. Using
 * those numbers here means a ticket that is also a grievance is already being
 * tracked to the right clock, rather than needing a separate queue.
 */
const FIRST_REPLY_HOURS = 24;
const RESOLUTION_DAYS = 15;

const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / 36e5;

const slaFor = (ticket) => {
  if (ticket.status !== 'pending') return { state: 'done', hoursOpen: null, awaitingFirstReply: false };

  const hoursOpen = hoursSince(ticket.createdAt);
  const awaitingFirstReply = !ticket.replies || ticket.replies.length === 0;

  let state = 'ok';
  if (hoursOpen >= RESOLUTION_DAYS * 24) state = 'overdue';
  else if (awaitingFirstReply && hoursOpen >= FIRST_REPLY_HOURS) state = 'needs_reply';
  else if (awaitingFirstReply && hoursOpen >= FIRST_REPLY_HOURS * 0.75) state = 'due_soon';

  return { state, hoursOpen: Math.floor(hoursOpen), awaitingFirstReply };
};

/** GET /admin/support — the desk. Oldest first, same reasoning as the report queue. */
const getTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending', search } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    if (search) {
      const matching = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').limit(100);

      query.$or = [
        { reason: { $regex: search, $options: 'i' } },
        { userId: { $in: matching.map((u) => u._id) } },
      ];
    }

    const perPage = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * perPage;

    const [tickets, total] = await Promise.all([
      Support.find(query)
        // imageUrl often holds a base64 data URI several hundred kilobytes
        // long. The list only needs to know an attachment exists; the detail
        // endpoint serves the image itself.
        .select('-imageUrl')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(perPage)
        .populate('userId', 'name username email avatar status'),
      Support.countDocuments(query),
    ]);

    const withAttachment = await Support.find({
      _id: { $in: tickets.map((t) => t._id) },
      imageUrl: { $exists: true, $nin: [null, ''] },
    }).select('_id');
    const attachmentIds = new Set(withAttachment.map((t) => String(t._id)));

    return success(res, {
      data: tickets.map((t) => ({
        ...t.toObject(),
        sla: slaFor(t),
        hasAttachment: attachmentIds.has(String(t._id)),
      })),
      total,
      page: parseInt(page, 10) || 1,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/support/stats */
const getSupportStats = async (req, res, next) => {
  try {
    const firstReplyCutoff = new Date(Date.now() - FIRST_REPLY_HOURS * 36e5);

    const [pending, resolved, rejected, awaitingReply, oldest] = await Promise.all([
      Support.countDocuments({ status: 'pending' }),
      Support.countDocuments({ status: 'resolved' }),
      Support.countDocuments({ status: 'rejected' }),
      Support.countDocuments({
        status: 'pending',
        // Tickets created before `replies` existed have no such field at all,
        // and $size:0 matches only an existing empty array — it would report
        // every historic ticket as already answered.
        $or: [{ replies: { $size: 0 } }, { replies: { $exists: false } }],
        createdAt: { $lt: firstReplyCutoff },
      }),
      Support.findOne({ status: 'pending' }).sort({ createdAt: 1 }).select('createdAt'),
    ]);

    return success(res, {
      pending,
      resolved,
      rejected,
      awaitingReply,
      oldestOpenAgeHours: oldest ? Math.floor(hoursSince(oldest.createdAt)) : null,
      firstReplyHours: FIRST_REPLY_HOURS,
      resolutionDays: RESOLUTION_DAYS,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/support/:id */
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Support.findById(req.params.id)
      .populate('userId', 'name username email avatar status createdAt');
    if (!ticket) return fail(res, 'Ticket not found', 404);

    return success(res, { ...ticket.toObject(), sla: slaFor(ticket) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /admin/support/:id/reply
 *
 * Reaches the user in-app and by email by default. The in-app notification is
 * what they will actually see, since the ticket was raised in the app; email is
 * the fallback for someone who has since uninstalled.
 *
 * A failed email does not fail the reply — the reply is already recorded and
 * delivered in-app, and losing it would be worse than losing the email copy.
 */
const replyToTicket = async (req, res, next) => {
  try {
    const { body, channel = 'both' } = req.body;

    if (!body || !body.trim()) return fail(res, 'Reply cannot be empty', 400);
    if (!['notification', 'email', 'both'].includes(channel)) {
      return fail(res, 'channel must be notification, email, or both', 400);
    }

    const ticket = await Support.findById(req.params.id).populate('userId', 'name email');
    if (!ticket) return fail(res, 'Ticket not found', 404);
    if (!ticket.userId) return fail(res, 'The account that raised this ticket no longer exists', 400);

    const text = body.trim();

    ticket.replies.push({
      body: text,
      adminId: req.user.sub,
      adminName: req.user.name,
      channel,
    });
    await ticket.save();

    let emailDelivered = null;

    if (channel === 'notification' || channel === 'both') {
      await createNotification({
        user: ticket.userId._id,
        title: 'Support replied to your request',
        body: text.length > 140 ? `${text.slice(0, 137)}…` : text,
        type: 'support',
        metadata: { ticketId: ticket._id.toString() },
      });
    }

    if ((channel === 'email' || channel === 'both') && ticket.userId.email) {
      const escapeHtml = (value) =>
        String(value == null ? '' : value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      try {
        await sendEmail({
          to: ticket.userId.email,
          subject: 'Re: your FilmyConnect support request',
          text: `${text}\n\n— FilmyConnect Support\n\nYour original request:\n${ticket.reason}`,
          html: `
<div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
  <p>Hi ${escapeHtml(ticket.userId.name)},</p>
  <div style="white-space: pre-wrap; background:#f9f9f9; padding:15px; border-radius:4px;">${escapeHtml(text)}</div>
  <p style="color:#666; font-size:13px;">— FilmyConnect Support</p>
  <hr style="border:0; border-top:1px solid #eee; margin:20px 0;" />
  <p style="color:#888; font-size:12px;"><strong>Your original request:</strong><br/>${escapeHtml(ticket.reason)}</p>
</div>`,
        });
        emailDelivered = true;
      } catch (mailErr) {
        console.error('[Support] Reply saved but email failed:', mailErr.message);
        emailDelivered = false;
      }
    }

    await recordAudit(req, {
      action: AUDIT_ACTIONS.SUPPORT_REPLY,
      targetType: 'Support',
      targetId: ticket._id,
      targetLabel: ticket.userId.name,
      summary: `Replied to ${ticket.userId.name}'s support ticket`,
      meta: { channel, emailDelivered, replyLength: text.length },
    });

    return success(res, { ticket, emailDelivered });
  } catch (err) {
    next(err);
  }
};

/** PUT /admin/support/:id/status — close a ticket as resolved or rejected. */
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!['resolved', 'rejected', 'pending'].includes(status)) {
      return fail(res, 'status must be resolved, rejected, or pending', 400);
    }

    const ticket = await Support.findById(req.params.id).populate('userId', 'name');
    if (!ticket) return fail(res, 'Ticket not found', 404);

    const previous = ticket.status;
    ticket.status = status;
    if (notes !== undefined) ticket.adminNotes = notes;

    if (status === 'pending') {
      ticket.resolvedBy = undefined;
      ticket.resolvedByName = undefined;
      ticket.resolvedAt = undefined;
    } else {
      ticket.resolvedBy = req.user.sub;
      ticket.resolvedByName = req.user.name;
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    await recordAudit(req, {
      action: AUDIT_ACTIONS.SUPPORT_STATUS_CHANGE,
      targetType: 'Support',
      targetId: ticket._id,
      targetLabel: ticket.userId?.name,
      summary: `Support ticket ${previous} → ${status}`,
      meta: { previous, status, notes, hoursOpen: Math.floor(hoursSince(ticket.createdAt)) },
    });

    return success(res, ticket);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets,
  getSupportStats,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
};
