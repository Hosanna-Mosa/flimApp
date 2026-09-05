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

const hasCredentials = () =>
  Boolean(process.env.GA4_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);

const isConfigured = () => Boolean(process.env.GA4_PROPERTY_ID && hasCredentials());

/**
 * Resolve the service account key.
 *
 * GA4_CREDENTIALS_JSON holds the key itself and is preferred, because the file
 * is gitignored and so never reaches a server that deploys by pulling the repo.
 * Putting the contents in an environment variable is the only way to get it
 * there without either committing a private key or copying files by hand.
 *
 * GOOGLE_APPLICATION_CREDENTIALS still works, but is resolved against the
 * backend directory rather than the process working directory. A relative path
 * silently means different files depending on where node was started from —
 * locally that was backend/, in production it is backend/server/src, and the
 * same config then works in one place and not the other.
 */
const credentialOptions = () => {
  const inline = process.env.GA4_CREDENTIALS_JSON;
  if (inline) {
    let parsed;
    try {
      // Accept base64 too: some hosts mangle multi-line values, and a key
      // contains newlines inside private_key.
      const raw = inline.trim().startsWith('{')
        ? inline
        : Buffer.from(inline, 'base64').toString('utf8');
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `GA4_CREDENTIALS_JSON is set but could not be parsed as JSON or base64 JSON: ${err.message}`
      );
    }
    return { credentials: parsed, projectId: parsed.project_id };
  }

  const configured = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const path = require('path');
  const fs = require('fs');

  if (path.isAbsolute(configured)) return { keyFilename: configured };

  // A relative path has no single correct meaning here: the repo has been
  // deployed with .env in backend/ on one machine and in server/src on
  // another, and node is started from a different directory again. Rather
  // than pick one and be wrong half the time, try the plausible bases and use
  // whichever actually holds the file.
  const srcDir = path.resolve(__dirname, '..');
  const candidates = [
    path.resolve(process.cwd(), configured),
    path.resolve(srcDir, configured),
    path.resolve(srcDir, '..', '..', configured),
  ];

  const found = candidates.find((c) => {
    try {
      return fs.statSync(c).isFile();
    } catch {
      return false;
    }
  });

  if (!found) {
    throw new Error(
      `GOOGLE_APPLICATION_CREDENTIALS is "${configured}" but no file was found. Looked in: ` +
        `${[...new Set(candidates)].join(', ')}. Use an absolute path, or set GA4_CREDENTIALS_JSON instead.`
    );
  }

  return { keyFilename: found };
};

const getClient = () => {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { BetaAnalyticsDataClient } = require('@google-analytics/data');
      return new BetaAnalyticsDataClient(credentialOptions());
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
        'Set GA4_PROPERTY_ID, plus either GA4_CREDENTIALS_JSON (the service account key itself) or GOOGLE_APPLICATION_CREDENTIALS (a path to it), on the server.',
    };
  }

  let client;
  try {
    client = await getClient();
  } catch (err) {
    // A bad path or unparseable key would otherwise repeat once per report and
    // bury the single cause under six identical lines.
    clientPromise = null;
    return { configured: true, credentialError: err.message, errors: [err.message], totals: {}, daily: [], screens: [], events: [], platforms: [], countries: [], realtime: null };
  }
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

    /**
   * Realtime is a different store from the one runReport reads.
   *
   * GA4 processes events into its reporting tables over several hours — up to a
   * day for a property's first data — so a freshly released build shows nothing
   * in the figures below while quite obviously working. The realtime endpoint
   * answers from the last 30 minutes immediately, which is the difference
   * between "this is broken" and "this is still processing".
   */
  const runRealtime = async () => {
    try {
      const [response] = await client.runRealtimeReport({
        property: property(),
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        limit: 10,
      });
      const rows = shape(response, ['screen'], ['activeUsers', 'screenPageViews']);
      const [totalsResponse] = await client.runRealtimeReport({
        property: property(),
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      });
      const t = shape(totalsResponse, [], ['activeUsers', 'screenPageViews'])[0] || {};
      return {
        activeUsers: t.activeUsers || 0,
        screenViews: t.screenPageViews || 0,
        screens: rows,
      };
    } catch (err) {
      logger.error(`[FirebaseAnalytics] realtime failed: ${err.message}`);
      return null;
    }
  };

  const [
    totals, daily, screens, events, platforms, countries,
    cities, devices, osVersions, appVersions, newVsReturning, languages,
    stability, engagement, realtime,
  ] = await Promise.all([
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

    run('cities', {
      dateRanges,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }, ['city'], ['activeUsers']),

    run('devices', {
      dateRanges,
      dimensions: [{ name: 'deviceModel' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }, ['device'], ['activeUsers']),

    run('osVersions', {
      dateRanges,
      dimensions: [{ name: 'operatingSystemVersion' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }, ['osVersion'], ['activeUsers']),

    // Which builds people are actually on. The most direct answer to "has the
    // release reached anyone yet", which no other report gives.
    run('appVersions', {
      dateRanges,
      dimensions: [{ name: 'appVersion' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    }, ['appVersion'], ['activeUsers']),

    run('newVsReturning', {
      dateRanges,
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'activeUsers' }],
    }, ['kind'], ['activeUsers']),

    run('languages', {
      dateRanges,
      dimensions: [{ name: 'language' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    }, ['language'], ['activeUsers']),

    // Crashlytics has no read API, but GA4 carries the headline crash metrics,
    // so app health can be shown here even though individual stack traces
    // stay in the Firebase console.
    run('stability', {
      dateRanges,
      metrics: [{ name: 'crashFreeUsersRate' }, { name: 'crashAffectedUsers' }],
    }, [], ['crashFreeUsersRate', 'crashAffectedUsers']),

    run('engagement', {
      dateRanges,
      metrics: [
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
        { name: 'engagementRate' },
      ],
    }, [], ['averageSessionDuration', 'screenPageViewsPerSession', 'engagementRate']),

    runRealtime(),
  ]);

  const t = totals.rows[0] || {};
  const failures = [totals, daily, screens, events, platforms, countries, cities, devices, osVersions, appVersions, newVsReturning, languages, stability, engagement]
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
    realtime,
    screens: screens.rows,
    events: events.rows,
    cities: cities.rows,
    devices: devices.rows,
    osVersions: osVersions.rows,
    appVersions: appVersions.rows,
    newVsReturning: newVsReturning.rows,
    languages: languages.rows,
    stability: {
      crashFreeRate: stability.rows[0]?.crashFreeUsersRate ?? null,
      affectedUsers: stability.rows[0]?.crashAffectedUsers ?? 0,
    },
    engagement: {
      avgSessionSeconds: Math.round(engagement.rows[0]?.averageSessionDuration || 0),
      screensPerSession: Math.round((engagement.rows[0]?.screenPageViewsPerSession || 0) * 10) / 10,
      engagementRate: Math.round((engagement.rows[0]?.engagementRate || 0) * 1000) / 10,
    },
    platforms: platforms.rows,
    countries: countries.rows,
    /** True when realtime has traffic but the processed tables do not yet. */
    stillProcessing: (t.activeUsers || 0) === 0 && (realtime?.activeUsers || 0) > 0,
    // Surfaced rather than swallowed: a permissions mistake on the service
    // account looks exactly like "no data" otherwise.
    errors: failures,
  };
};

module.exports = { getFirebaseReport, isConfigured };
