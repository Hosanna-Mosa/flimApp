const { Schema, model, Types } = require('mongoose');

/**
 * A behaviour event reported by the app.
 *
 * These cover only what the server cannot already infer — which screens people
 * open, where they abandon a flow, what they tap. Signups, posts and payments
 * are not sent from the client: the server already records them as a side
 * effect of the work itself, and a client-reported copy would be both
 * redundant and less trustworthy, since it can be dropped, delayed or forged.
 */
const AnalyticsEventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 64 },

    /** Absent for events fired before sign-in. */
    user: { type: Types.ObjectId, ref: 'User', index: true },

    /** Groups events from one app run without identifying the device. */
    sessionId: { type: String, maxlength: 64 },

    platform: { type: String, enum: ['ios', 'android', 'web', 'unknown'], default: 'unknown' },
    appVersion: { type: String, maxlength: 24 },

    /** Small bag of event-specific values. Size-capped on ingest. */
    props: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AnalyticsEventSchema.index({ name: 1, createdAt: -1 });
AnalyticsEventSchema.index({ createdAt: -1 });

// Events are for trends, not records. Ninety days is enough to compare this
// month with last, and it keeps a chatty client from growing the collection
// without limit.
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = model('AnalyticsEvent', AnalyticsEventSchema);
