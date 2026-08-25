const { Schema, model, Types } = require('mongoose');

/**
 * A PaymentSession is the bridge between the mobile app and Razorpay's *web*
 * checkout. The app never opens a native Razorpay SDK: it asks the backend for
 * a session, gets back a plain https URL, and hands that URL to the system
 * browser. The browser is unauthenticated, so `token` (a long random string) is
 * what identifies the session on the public checkout/callback routes — it is a
 * short-lived, single-purpose bearer credential, which is why it expires.
 */
const PaymentSessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    purpose: {
      type: String,
      enum: ['SUBSCRIPTION', 'WALLET'],
      required: true,
    },
    // Only set for SUBSCRIPTION sessions.
    planType: {
      type: String,
      enum: ['1_MONTH', '3_MONTHS', '6_MONTHS', '9_MONTHS'],
    },

    // Rupees (human amount) and paise (what Razorpay is given) are both stored
    // so fulfilment never has to re-derive one from the other.
    amount: { type: Number, required: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED'],
      default: 'CREATED',
      index: true,
    },
    // Set once fulfilment (badge activation / wallet credit) has run, so a
    // webhook and a browser callback racing each other cannot double-credit.
    fulfilled: { type: Boolean, default: false },
    failureReason: { type: String },

    // Deep link the browser is sent to when the flow ends. Validated against an
    // allowlist at creation time so this can never become an open redirect.
    returnUrl: { type: String, required: true },

    prefill: {
      name: { type: String },
      email: { type: String },
      contact: { type: String },
    },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo drops the document 15 minutes after it expires, keeping finished
// sessions around briefly so a late status poll still gets a real answer.
PaymentSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 });

module.exports = model('PaymentSession', PaymentSessionSchema);
