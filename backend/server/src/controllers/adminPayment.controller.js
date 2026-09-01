const PaymentSession = require('../models/PaymentSession.model');
const Subscription = require('../models/Subscription.model');
const Wallet = require('../models/Wallet.model');
const User = require('../models/User.model');
const { success, fail } = require('../utils/response');

/**
 * Money moves through three separate Razorpay paths in this codebase, each
 * leaving a different record:
 *
 *   PaymentSession  services/payment.service.js — the newer unified checkout.
 *                   Records every attempt, including ones that fail.
 *   Subscription    controllers/subscription.controller.js — creates the order
 *                   itself and stores the Razorpay ids on the subscription.
 *   Wallet          controllers/wallet.controller.js — creates the order and,
 *                   only once verified, appends a credit transaction. An
 *                   abandoned or failed top-up leaves no record anywhere, so
 *                   wallet figures here count completed top-ups only.
 *
 * Reporting on any one of these alone under-reports revenue, so everything
 * below normalises all three into a single shape before aggregating.
 */

const SOURCES = { SESSION: 'session', SUBSCRIPTION: 'subscription', WALLET: 'wallet' };

/** Normalised statuses so three vocabularies can be filtered as one. */
const normaliseSessionStatus = (s) =>
  ({ PAID: 'paid', FAILED: 'failed', CANCELLED: 'cancelled', EXPIRED: 'expired', CREATED: 'started' }[s] || 'started');

const normaliseSubscriptionStatus = (s) =>
  ({ ACTIVE: 'paid', EXPIRED: 'paid', CANCELLED: 'cancelled', FAILED: 'failed', PENDING: 'started' }[s] || 'started');

const toEntry = {
  session: (d) => ({
    id: String(d._id),
    source: SOURCES.SESSION,
    status: normaliseSessionStatus(d.status),
    rawStatus: d.status,
    purpose: d.purpose === 'WALLET' ? 'wallet top-up' : 'subscription',
    planType: d.planType || null,
    amount: d.amount,
    currency: d.currency || 'INR',
    razorpayOrderId: d.razorpayOrderId || null,
    razorpayPaymentId: d.razorpayPaymentId || null,
    fulfilled: d.fulfilled,
    failureReason: d.failureReason || null,
    user: d.user || null,
    createdAt: d.createdAt,
  }),
  subscription: (d) => ({
    id: String(d._id),
    source: SOURCES.SUBSCRIPTION,
    status: normaliseSubscriptionStatus(d.status),
    rawStatus: d.status,
    purpose: 'subscription',
    planType: d.planType || null,
    amount: d.amount,
    currency: d.currency || 'INR',
    razorpayOrderId: d.razorpayOrderId || null,
    razorpayPaymentId: d.razorpayPaymentId || null,
    fulfilled: d.status === 'ACTIVE' || d.status === 'EXPIRED',
    failureReason: null,
    user: d.user || null,
    createdAt: d.createdAt,
  }),
  wallet: (walletDoc, tx) => ({
    id: `${walletDoc._id}:${tx._id}`,
    source: SOURCES.WALLET,
    // Only verified top-ups are ever written, so these are paid by definition.
    status: 'paid',
    rawStatus: tx.type,
    purpose: 'wallet top-up',
    planType: null,
    amount: tx.amount,
    currency: walletDoc.currency || 'INR',
    razorpayOrderId: null,
    razorpayPaymentId: tx.reference || null,
    fulfilled: true,
    failureReason: null,
    user: walletDoc.user || null,
    createdAt: tx.createdAt,
    description: tx.description || null,
  }),
};

/** Wallet credits that came from a real top-up, not an admin adjustment. */
const isTopUp = (tx) => tx.type === 'credit' && !String(tx.reference || '').startsWith('admin_');

const parseRange = ({ from, to }) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

/** Pull and normalise every source, newest first. */
const collectEntries = async ({ range, source, purpose }) => {
  const dateFilter = range ? { createdAt: range } : {};
  const wanted = (s) => !source || source === 'all' || source === s;

  const [sessions, subscriptions, wallets] = await Promise.all([
    wanted(SOURCES.SESSION)
      ? PaymentSession.find(dateFilter).populate('user', 'name email avatar').lean()
      : [],
    wanted(SOURCES.SUBSCRIPTION)
      ? Subscription.find(dateFilter).populate('user', 'name email avatar').lean()
      : [],
    wanted(SOURCES.WALLET)
      ? Wallet.find({ 'transactions.0': { $exists: true } }).populate('user', 'name email avatar').lean()
      : [],
  ]);

  let entries = [
    ...sessions.map(toEntry.session),
    ...subscriptions.map(toEntry.subscription),
  ];

  for (const w of wallets) {
    for (const tx of w.transactions || []) {
      if (!isTopUp(tx)) continue;
      if (range) {
        const at = new Date(tx.createdAt);
        if (range.$gte && at < range.$gte) continue;
        if (range.$lte && at > range.$lte) continue;
      }
      entries.push(toEntry.wallet(w, tx));
    }
  }

  if (purpose && purpose !== 'all') {
    entries = entries.filter((e) => e.purpose === purpose);
  }

  return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/** GET /admin/payments — the unified ledger. */
const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status, source, purpose, from, to } = req.query;

    let entries = await collectEntries({ range: parseRange({ from, to }), source, purpose });
    if (status && status !== 'all') entries = entries.filter((e) => e.status === status);

    const perPage = Math.min(parseInt(limit, 10) || 25, 200);
    const currentPage = parseInt(page, 10) || 1;
    const start = (currentPage - 1) * perPage;

    return success(res, {
      data: entries.slice(start, start + perPage),
      total: entries.length,
      page: currentPage,
      limit: perPage,
      totalPages: Math.max(1, Math.ceil(entries.length / perPage)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/payments/summary — how much came in, and how well checkout works.
 */
const getPaymentSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const entries = await collectEntries({ range: parseRange({ from, to }) });

    const paid = entries.filter((e) => e.status === 'paid');
    const collected = paid.reduce((sum, e) => sum + (e.amount || 0), 0);

    const tally = (key) =>
      entries.reduce((acc, e) => {
        const k = e[key] || 'unknown';
        acc[k] = acc[k] || { count: 0, paidCount: 0, collected: 0 };
        acc[k].count += 1;
        if (e.status === 'paid') {
          acc[k].paidCount += 1;
          acc[k].collected += e.amount || 0;
        }
        return acc;
      }, {});

    const byStatus = entries.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    }, {});

    // Daily series for the chart, oldest first.
    const daily = {};
    for (const e of paid) {
      const day = new Date(e.createdAt).toISOString().slice(0, 10);
      daily[day] = daily[day] || { date: day, count: 0, collected: 0 };
      daily[day].count += 1;
      daily[day].collected += e.amount || 0;
    }

    const attempted = entries.length;
    const failureReasons = entries
      .filter((e) => e.failureReason)
      .reduce((acc, e) => {
        acc[e.failureReason] = (acc[e.failureReason] || 0) + 1;
        return acc;
      }, {});

    return success(res, {
      attempted,
      paidCount: paid.length,
      collected,
      currency: paid[0]?.currency || 'INR',
      averagePayment: paid.length ? Math.round((collected / paid.length) * 100) / 100 : 0,
      successRate: attempted ? Math.round((paid.length / attempted) * 1000) / 10 : 0,
      byStatus,
      bySource: tally('source'),
      byPurpose: tally('purpose'),
      byPlan: tally('planType'),
      failureReasons,
      daily: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/payments/exceptions — money taken with nothing delivered.
 *
 * With no refund path in the application, these are the cases that can only be
 * put right by hand, so they get their own view rather than being buried in
 * the ledger.
 */
const getPaymentExceptions = async (req, res, next) => {
  try {
    const STALE_HOURS = 2;
    const staleBefore = new Date(Date.now() - STALE_HOURS * 36e5);

    const [paidUnfulfilled, stuckSessions, stuckSubscriptions] = await Promise.all([
      PaymentSession.find({ status: 'PAID', fulfilled: false })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .lean(),
      PaymentSession.find({ status: 'CREATED', createdAt: { $lt: staleBefore } })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Subscription.find({ status: 'PENDING', createdAt: { $lt: staleBefore } })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return success(res, {
      paidNotDelivered: paidUnfulfilled.map(toEntry.session),
      abandonedCheckouts: stuckSessions.map(toEntry.session),
      pendingSubscriptions: stuckSubscriptions.map(toEntry.subscription),
      staleAfterHours: STALE_HOURS,
      totals: {
        paidNotDelivered: paidUnfulfilled.length,
        abandonedCheckouts: stuckSessions.length,
        pendingSubscriptions: stuckSubscriptions.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/payments/lookup — find a payment by Razorpay id or user.
 * Available to operations so a support ticket can be answered.
 */
const lookupPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, userId } = req.query;
    if (!orderId && !paymentId && !userId) {
      return fail(res, 'Provide orderId, paymentId, or userId', 400);
    }

    if (userId) {
      const [user, entries] = await Promise.all([
        User.findById(userId).select('name email avatar'),
        collectEntries({}),
      ]);
      if (!user) return fail(res, 'User not found', 404);
      return success(res, {
        user,
        entries: entries.filter((e) => String(e.user?._id || e.user) === String(userId)),
      });
    }

    const idQuery = orderId ? { razorpayOrderId: orderId } : { razorpayPaymentId: paymentId };
    const [session, subscription] = await Promise.all([
      PaymentSession.findOne(idQuery).populate('user', 'name email avatar').lean(),
      Subscription.findOne(idQuery).populate('user', 'name email avatar').lean(),
    ]);

    const entries = [
      ...(session ? [toEntry.session(session)] : []),
      ...(subscription ? [toEntry.subscription(subscription)] : []),
    ];

    if (!entries.length) return fail(res, 'No payment found with that reference', 404);
    return success(res, { entries });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/payments/export — CSV for accounting. */
const exportPayments = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    let entries = await collectEntries({ range: parseRange({ from, to }) });
    if (status && status !== 'all') entries = entries.filter((e) => e.status === status);

    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      // Quote anything a spreadsheet would otherwise split or mangle.
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = [
      'date', 'source', 'status', 'purpose', 'plan', 'amount', 'currency',
      'razorpay_order_id', 'razorpay_payment_id', 'fulfilled', 'user_name', 'user_email',
    ];

    const rows = entries.map((e) =>
      [
        new Date(e.createdAt).toISOString(),
        e.source,
        e.status,
        e.purpose,
        e.planType || '',
        e.amount,
        e.currency,
        e.razorpayOrderId || '',
        e.razorpayPaymentId || '',
        e.fulfilled ? 'yes' : 'no',
        e.user?.name || '',
        e.user?.email || '',
      ].map(cell).join(',')
    );

    const csv = [header.join(','), ...rows].join('\n');
    const filename = `filmyconnect-payments-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPayments,
  getPaymentSummary,
  getPaymentExceptions,
  lookupPayment,
  exportPayments,
};
