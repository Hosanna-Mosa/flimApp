const logger = require('../config/logger');

/**
 * Reads Firebase Analytics through the Google Analytics Data API.
 *
 * Firebase Analytics does not have an API of its own — its data lands in a GA4
 * property, and that property is what is queried here. Two things follow:
 * numbers appear only after a build carrying the SDK is released and people
 * update, and GA4 aggregates on its own schedule, so today's figures move for
 * some hours before settling.
 *
 * Crashlytics is deliberately absent. Google publishes no read API for it; the
 * only programmatic route is a BigQuery export on a paid plan. The panel links
 * to the console for crashes rather than pretending to fetch them.
 *
 * Configuration, both required:
 *   GA4_PROPERTY_ID                 numeric property id, not the G- id
 *   GOOGLE_APPLICATION_CREDENTIALS  path to a service account key with Viewer
 *                                   on that property
 */

let clientPromise = null;

const isConfigured = () =>
  Boolean(process.env.GA4_PROPERTY_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS);

const getClient = () => {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { BetaAnalyticsDataClient } = require('@google-analytics/data');
      return new BetaAnalyticsDataClient();
    })();
  }
  return clientPromise;
};

const property = () => `properties/${process.env.GA4_PROPERTY_ID}`;

/** Rows come back as arrays of dimension/metric values; name them once here. */
const shape = (response, dimensions, metrics) =>
  (response?.rows || []).map((row) => {
    const out = {};
    dimensions.forEach((d, i) => {
      out[d] = row.dimensionValues?.[i]?.value ?? null;
    });
    metrics.forEach((m, i) => {
      const raw = row.metricValues?.[i]?.value;
      const num = Number(raw);
      out[m] = Number.isFinite(num) ? num : 0;
    });
    return out;
  });

/**
 * Everything the Firebase panel shows, in one call.
 *
 * The requests are independent, so they run together — GA4 is a network round
 * trip each and running them in series would make the page noticeably slow for
 * no reason. One failing report does not lose the others.
 */
const getFirebaseReport = async (days = 28) => {
  if (!isConfigured()) {
    return {
      configured: false,
      reason:
        'Set GA4_PROPERTY_ID and GOOGLE_APPLICATION_CREDENTIALS on the server to read Firebase Analytics.',
    };
  }

  const client = await getClient();
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  const run = async (label, request, dimensions, metrics) => {
    try {
      const [response] = await client.runReport({ property: property(), ...request });
      return { ok: true, rows: shape(response, dimensions, metrics) };
    } catch (err) {
      logger.error(`[FirebaseAnalytics] ${label} failed: ${err.message}`);
      return { ok: false, error: err.message, rows: [] };
    }
  };

  const [totals, daily, screens, events, platforms, countries] = await Promise.all([
    run('totals', {
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },
      ],
    }, [], ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'userEngagementDuration']),

    run('daily', {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }, ['date'], ['activeUsers', 'sessions']),

    run('screens', {
      dateRanges,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20,
    }, ['screen'], ['screenPageViews', 'activeUsers']),

    run('events', {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25,
    }, ['event'], ['eventCount', 'activeUsers']),

    run('platforms', {
      dateRanges,
      dimensions: [{ name: 'platform' }],
      metrics: [{ name: 'activeUsers' }],
    }, ['platform'], ['activeUsers']),

    run('countries', {
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }, ['country'], ['activeUsers']),
  ]);

  const t = totals.rows[0] || {};
  const failures = [totals, daily, screens, events, platforms, countries]
    .filter((r) => !r.ok)
    .map((r) => r.error);

  return {
    configured: true,
    days,
    propertyId: process.env.GA4_PROPERTY_ID,
    // GA4 returns dates as YYYYMMDD; the charts expect ISO.
    daily: daily.rows.map((r) => ({
      date: r.date ? `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}` : null,
      activeUsers: r.activeUsers,
      sessions: r.sessions,
    })),
    totals: {
      activeUsers: t.activeUsers || 0,
      newUsers: t.newUsers || 0,
      sessions: t.sessions || 0,
      screenViews: t.screenPageViews || 0,
      avgEngagementSeconds:
        t.sessions > 0 ? Math.round((t.userEngagementDuration || 0) / t.sessions) : 0,
    },
    screens: screens.rows,
    events: events.rows,
    platforms: platforms.rows,
    countries: countries.rows,
    // Surfaced rather than swallowed: a permissions mistake on the service
    // account looks exactly like "no data" otherwise.
    errors: failures,
  };
};

module.exports = { getFirebaseReport, isConfigured };
