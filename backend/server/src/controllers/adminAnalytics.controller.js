const User = require('../models/User.model');
const Post = require('../models/Post.model');
const Like = require('../models/Like.model');
const Comment = require('../models/Comment.model');
const Follow = require('../models/Follow.model');
const Message = require('../models/Message.model');
const Subscription = require('../models/Subscription.model');
const Wallet = require('../models/Wallet.model');
const AnalyticsEvent = require('../models/AnalyticsEvent.model');
const { success } = require('../utils/response');
const { getFirebaseReport } = require('../services/firebaseAnalytics.service');

/**
 * Product analytics derived from the data the app already writes.
 *
 * Nothing here needs the client to be instrumented: signups, posts, likes and
 * payments are already recorded as a side effect of the app working, so these
 * numbers are true for the whole history rather than starting from the day
 * tracking was switched on. Client-side events land in AnalyticsEvent and are
 * reported alongside, but only cover behaviour the server cannot infer.
 */

const DAY = 864e5;
const since = (days) => new Date(Date.now() - days * DAY);

/** Bucket a collection by day on a date field, oldest first. */
const dailySeries = async (Model, dateField, days, match = {}) => {
  const rows = await Model.aggregate([
    { $match: { ...match, [dateField]: { $gte: since(days) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count }));
};

/** Fill days with no rows so a chart does not silently compress its x-axis. */
const padSeries = (series, days) => {
  const byDate = Object.fromEntries(series.map((s) => [s.date, s.count]));
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    out.push({ date, count: byDate[date] || 0 });
  }
  return out;
};

/** GET /admin/analytics/overview */
const getOverview = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const from = since(days);
    const prevFrom = since(days * 2);

    const [
      totalUsers, newUsers, prevNewUsers,
      totalPosts, newPosts,
      likes, comments, messages, follows,
      verifiedUsers, activeUsers, everLoggedIn,
      creators, paidSubscriptions, walletAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: from } }),
      User.countDocuments({ createdAt: { $gte: prevFrom, $lt: from } }),
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: from } }),
      Like.countDocuments({ createdAt: { $gte: from } }),
      Comment.countDocuments({ createdAt: { $gte: from } }),
      Message.countDocuments({ createdAt: { $gte: from } }),
      Follow.countDocuments({ createdAt: { $gte: from } }),
      User.countDocuments({ isBadgeVerified: true }),
      User.countDocuments({ lastLoginAt: { $gte: from } }),
      User.countDocuments({ lastLoginAt: { $exists: true, $ne: null } }),
      Post.distinct('author'),
      Subscription.countDocuments({ status: { $in: ['ACTIVE', 'EXPIRED'] } }),
      Wallet.aggregate([
        { $unwind: '$transactions' },
        { $match: { 'transactions.type': 'credit' } },
        { $group: { _id: null, total: { $sum: '$transactions.amount' } } },
      ]),
    ]);

    const pctChange = prevNewUsers
      ? Math.round(((newUsers - prevNewUsers) / prevNewUsers) * 1000) / 10
      : null;

    return success(res, {
      days,
      users: {
        total: totalUsers,
        new: newUsers,
        previousPeriod: prevNewUsers,
        changePct: pctChange,
        verified: verifiedUsers,
        creators: creators.length,
        /** Share of all users who have ever published — the activation number. */
        activationPct: totalUsers ? Math.round((creators.length / totalUsers) * 1000) / 10 : 0,
      },
      active: {
        inPeriod: activeUsers,
        everLoggedIn,
        // lastLoginAt was added after launch, so accounts that never signed in
        // again since then have none. Coverage is reported so the number is not
        // read as a complete picture of who is active.
        coveragePct: totalUsers ? Math.round((everLoggedIn / totalUsers) * 1000) / 10 : 0,
      },
      content: { totalPosts, newPosts, likes, comments, messages, follows },
      monetisation: {
        paidSubscriptions,
        walletTopUpTotal: walletAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/analytics/growth */
const getGrowth = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);

    const [signups, posts] = await Promise.all([
      dailySeries(User, 'createdAt', days),
      dailySeries(Post, 'createdAt', days),
    ]);

    // Cumulative total needs the count from before the window starts.
    const before = await User.countDocuments({ createdAt: { $lt: since(days) } });
    const padded = padSeries(signups, days);
    let running = before;
    const cumulative = padded.map((d) => {
      running += d.count;
      return { date: d.date, total: running };
    });

    return success(res, {
      days,
      signups: padded,
      posts: padSeries(posts, days),
      cumulativeUsers: cumulative,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/analytics/funnel
 *
 * Each step is a subset of the one above it, so the drop between two rows is
 * the thing worth reading rather than any single number.
 */
const getFunnel = async (req, res, next) => {
  try {
    const [total, withProfile, creators, verified, payers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ $or: [{ bio: { $nin: [null, ''] } }, { avatar: { $nin: [null, ''] } }] }),
      Post.distinct('author'),
      User.countDocuments({ isBadgeVerified: true }),
      Subscription.distinct('user', { status: { $in: ['ACTIVE', 'EXPIRED'] } }),
    ]);

    const steps = [
      { key: 'signed_up', label: 'Created an account', count: total },
      { key: 'profile', label: 'Added a photo or bio', count: withProfile },
      { key: 'posted', label: 'Published a post', count: creators.length },
      { key: 'verified', label: 'Got verified', count: verified },
      { key: 'paid', label: 'Paid for a subscription', count: payers.length },
    ];

    return success(res, {
      steps: steps.map((s, i) => ({
        ...s,
        pctOfTotal: total ? Math.round((s.count / total) * 1000) / 10 : 0,
        pctOfPrevious:
          i === 0 || !steps[i - 1].count
            ? null
            : Math.round((s.count / steps[i - 1].count) * 1000) / 10,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/analytics/retention
 *
 * Cohorts by signup month against whether the account has signed in recently.
 * This is a coarse measure — it depends on lastLoginAt, which only exists for
 * accounts that have signed in since the field was added — so the response
 * carries its own coverage figure rather than presenting it as exact.
 */
const getRetention = async (req, res, next) => {
  try {
    const rows = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          signedUp: { $sum: 1 },
          activeLast30: {
            $sum: { $cond: [{ $gte: ['$lastLoginAt', since(30)] }, 1, 0] },
          },
          activeLast90: {
            $sum: { $cond: [{ $gte: ['$lastLoginAt', since(90)] }, 1, 0] },
          },
          everReturned: {
            $sum: { $cond: [{ $ifNull: ['$lastLoginAt', false] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return success(res, {
      cohorts: rows.map((r) => ({
        month: r._id,
        signedUp: r.signedUp,
        everReturned: r.everReturned,
        activeLast90: r.activeLast90,
        activeLast30: r.activeLast30,
        retention30Pct: r.signedUp ? Math.round((r.activeLast30 / r.signedUp) * 1000) / 10 : 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /admin/analytics/events — whatever the app has reported. */
const getEvents = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const from = since(days);

    const [top, daily, total] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: from } } },
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
            users: { $addToSet: '$user' },
          },
        },
        { $project: { name: '$_id', count: 1, users: { $size: '$users' }, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 25 },
      ]),
      dailySeries(AnalyticsEvent, 'createdAt', days),
      AnalyticsEvent.countDocuments({ createdAt: { $gte: from } }),
    ]);

    return success(res, { days, total, top, daily: padSeries(daily, days) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /admin/analytics/firebase
 *
 * Answers 200 with configured:false rather than an error when the credentials
 * are absent, so the page can explain what is missing instead of showing a
 * failure for something that has simply not been set up yet.
 */
const getFirebase = async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 28, 365);
    return success(res, await getFirebaseReport(days));
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getGrowth, getFunnel, getRetention, getEvents, getFirebase };
