const AnalyticsEvent = require('../models/AnalyticsEvent.model');
const { success, fail } = require('../utils/response');

/** Names the app is allowed to send. An unknown name is dropped rather than
 *  stored, so a typo or a stale build cannot quietly create a new metric that
 *  nobody is looking at. */
const ALLOWED_EVENTS = new Set([
  'screen_view',
  'onboarding_step',
  'onboarding_complete',
  'post_create_started',
  'post_create_failed',
  'search_performed',
  'profile_viewed',
  'checkout_started',
  'checkout_abandoned',
  'verification_started',
  'app_opened',
]);

const MAX_BATCH = 50;
const MAX_PROPS_BYTES = 2048;

/**
 * POST /events — batched event ingest.
 *
 * Optional auth: events fired before sign-in are the most interesting ones,
 * since that is where people drop out of onboarding.
 *
 * Always answers 202. A client must never retry or surface an error because
 * analytics failed — dropping a metric is acceptable, breaking the screen the
 * user is on is not.
 */
const track = async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(202).json({ success: true, accepted: 0 });
    }

    const now = Date.now();
    const docs = [];

    for (const event of events.slice(0, MAX_BATCH)) {
      if (!event || typeof event.name !== 'string') continue;
      if (!ALLOWED_EVENTS.has(event.name)) continue;

      let props = event.props;
      if (props && typeof props === 'object') {
        // Cap the payload so one oversized prop bag cannot bloat the write.
        if (Buffer.byteLength(JSON.stringify(props)) > MAX_PROPS_BYTES) props = { truncated: true };
      } else {
        props = undefined;
      }

      docs.push({
        name: event.name,
        user: req.user?.id || req.user?._id || undefined,
        sessionId: typeof event.sessionId === 'string' ? event.sessionId.slice(0, 64) : undefined,
        platform: ['ios', 'android', 'web'].includes(event.platform) ? event.platform : 'unknown',
        appVersion: typeof event.appVersion === 'string' ? event.appVersion.slice(0, 24) : undefined,
        props,
        // Honour a client timestamp only if it is sane; a wrong device clock
        // would otherwise scatter events across the wrong days.
        createdAt:
          typeof event.at === 'number' && Math.abs(now - event.at) < 7 * 864e5
            ? new Date(event.at)
            : new Date(),
      });
    }

    if (docs.length) {
      // Unordered so one bad document cannot discard the rest of the batch.
      await AnalyticsEvent.insertMany(docs, { ordered: false }).catch((err) => {
        console.error('[Analytics] Batch insert failed:', err.message);
      });
    }

    return res.status(202).json({ success: true, accepted: docs.length });
  } catch (err) {
    console.error('[Analytics] Track failed:', err.message);
    return res.status(202).json({ success: true, accepted: 0 });
  }
};

module.exports = { track, ALLOWED_EVENTS };
