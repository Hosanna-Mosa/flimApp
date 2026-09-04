const Razorpay = require('razorpay');
const crypto = require('crypto');

const Subscription = require('../models/Subscription.model');
const PaymentSession = require('../models/PaymentSession.model');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_PRICES = {
  '1_MONTH': 150,
  '3_MONTHS': 1299,
  '6_MONTHS': 2199,
  '9_MONTHS': 2999,
};

const PLAN_MONTHS = {
  '1_MONTH': 1,
  '3_MONTHS': 3,
  '6_MONTHS': 6,
  '9_MONTHS': 9,
};

// How long a checkout URL stays usable once handed to the browser.
const SESSION_TTL_MS = 20 * 60 * 1000;

/**
 * Schemes the browser is allowed to be redirected to when checkout finishes.
 * Anything outside this list is rejected at session-creation time. Without it,
 * returnUrl would be an open redirect that anyone with a login could aim at an
 * arbitrary site.
 *
 * - myapp / app.rork.filmy: the standalone app URL schemes (see app.json,
 *   AndroidManifest.xml and Info.plist)
 * - exp / exp+filmy: Expo Go and dev-client (exp://192.168.x.x:8081/--/...)
 * - https://filmyconnect24.com: the web build
 */
const DEFAULT_ALLOWED_RETURN_PREFIXES = [
  'myapp://',
  'app.rork.filmy://',
  'exp://',
  'exp+filmy://',
  'filmyconnect://',
  'https://filmyconnect24.com/',
];

const allowedReturnPrefixes = () => {
  const extra = (process.env.APP_RETURN_URL_PREFIXES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_RETURN_PREFIXES, ...extra];
};

const isAllowedReturnUrl = (url) => {
  if (typeof url !== 'string' || url.length > 512) return false;
  // A newline or control char could be smuggled into the Location header.
  if (/[\r\n\s]/.test(url)) return false;
  return allowedReturnPrefixes().some((prefix) => url.startsWith(prefix));
};

/**
 * Absolute origin the phone browser will hit. Razorpay requires callback_url to
 * be fully qualified, so this has to resolve to something reachable from the
 * device. In dev that is the LAN IP the app already talks to, which is why we
 * fall back to the incoming request host instead of hardcoding a domain.
 */
const publicBaseUrl = (req) => {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  // The Host header is attacker-controlled, so the fallback is development
  // only. In production PUBLIC_BASE_URL must be set explicitly.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_BASE_URL must be set in production');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
};

const buildCheckoutUrl = (req, token) => `${publicBaseUrl(req)}/payments/checkout/${token}`;

const timingSafeEquals = (expected, actual) => {
  const a = Buffer.from(String(expected), 'utf8');
  const b = Buffer.from(String(actual), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEquals(expected, signature);
};

const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEquals(expected, signature);
};

/**
 * Creates the Razorpay order plus the local session that fronts it.
 * Returns the session document; the caller turns it into a URL.
 */
const createSession = async ({ user, purpose, planType, amount, returnUrl }) => {
  let rupees;

  if (purpose === 'SUBSCRIPTION') {
    if (!PLAN_PRICES[planType]) {
      const err = new Error('Invalid plan type');
      err.status = 400;
      throw err;
    }
    rupees = PLAN_PRICES[planType];
  } else if (purpose === 'WALLET') {
    rupees = Number(amount);
    if (!Number.isFinite(rupees) || rupees <= 0 || rupees > 200000) {
      const err = new Error('Invalid amount');
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error('Invalid payment purpose');
    err.status = 400;
    throw err;
  }

  if (!isAllowedReturnUrl(returnUrl)) {
    const err = new Error('Invalid return URL');
    err.status = 400;
    throw err;
  }

  const amountPaise = Math.round(rupees * 100);
  const receiptPrefix = purpose === 'SUBSCRIPTION' ? 'sub' : 'wlt';

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `${receiptPrefix}_${user._id.toString().slice(-10)}_${Date.now()}`,
      notes: { purpose, userId: user._id.toString(), planType: planType || '' },
    });
  } catch (rzpErr) {
    console.error('[Payments] Razorpay order creation failed:', rzpErr);
    const desc = rzpErr.error ? rzpErr.error.description : rzpErr.description || rzpErr.message;
    const err = new Error(`Razorpay Error: ${desc || 'Unknown Razorpay error'}`);
    err.status = 502;
    throw err;
  }

  if (purpose === 'SUBSCRIPTION') {
    // Mirror the previous behaviour: one pending subscription per user at a time.
    await Subscription.deleteMany({ user: user._id, status: 'PENDING' });
    await Subscription.create({
      user: user._id,
      planType,
      amount: rupees,
      razorpayOrderId: order.id,
      status: 'PENDING',
    });
  }

  return PaymentSession.create({
    token: crypto.randomBytes(32).toString('hex'),
    user: user._id,
    purpose,
    planType: purpose === 'SUBSCRIPTION' ? planType : undefined,
    amount: rupees,
    amountPaise,
    currency: 'INR',
    razorpayOrderId: order.id,
    returnUrl,
    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: user.phone || '',
    },
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
};

const activateSubscription = async (session) => {
  const subscription = await Subscription.findOne({
    user: session.user,
    razorpayOrderId: session.razorpayOrderId,
  });

  if (!subscription) {
    console.error('[Payments] No subscription record for order', session.razorpayOrderId);
    return null;
  }

  const months = PLAN_MONTHS[subscription.planType] || 1;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  subscription.status = 'ACTIVE';
  subscription.razorpayPaymentId = session.razorpayPaymentId;
  subscription.razorpaySignature = session.razorpaySignature;
  subscription.startDate = startDate;
  subscription.endDate = endDate;
  await subscription.save();

  await User.findByIdAndUpdate(session.user, {
    isBadgeVerified: true,
    verifiedUntil: endDate,
    verificationStatus: 'active',
  });

  await Subscription.deleteMany({
    user: session.user,
    status: 'PENDING',
    _id: { $ne: subscription._id },
  });

  return subscription;
};

const creditWallet = async (session) => {
  const user = await User.findById(session.user);
  if (!user) return null;

  user.walletBalance = (user.walletBalance || 0) + session.amount;
  await user.save();

  let wallet = await Wallet.findOne({ user: session.user });
  if (!wallet) {
    wallet = new Wallet({ user: session.user, balance: user.walletBalance });
  } else {
    wallet.balance = user.walletBalance;
  }
  wallet.transactions.push({
    type: 'credit',
    amount: session.amount,
    description: 'Wallet Deposit',
    reference: session.razorpayPaymentId,
  });
  await wallet.save();

  return wallet;
};

/**
 * Marks a session paid and runs its side effects exactly once.
 *
 * The browser callback and the Razorpay webhook both land here and can race, so
 * the transition is a conditional update: whoever flips `fulfilled` from false
 * does the work and the loser is a no-op. Without this, a user could be
 * credited twice for one payment.
 */
const markPaid = async (session, { paymentId, signature }) => {
  const claimed = await PaymentSession.findOneAndUpdate(
    { _id: session._id, fulfilled: false },
    {
      $set: {
        status: 'PAID',
        fulfilled: true,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature || session.razorpaySignature,
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Another handler already fulfilled this session.
    return { session: await PaymentSession.findById(session._id), alreadyFulfilled: true };
  }

  try {
    if (claimed.purpose === 'SUBSCRIPTION') {
      await activateSubscription(claimed);
    } else if (claimed.purpose === 'WALLET') {
      await creditWallet(claimed);
    }
  } catch (err) {
    // The money is already captured, so the session stays PAID. Surface the
    // failure loudly rather than telling the app the payment did not happen.
    console.error('[Payments] Fulfilment failed for session', claimed.token, err);
  }

  return { session: claimed, alreadyFulfilled: false };
};

const markFailed = async (session, reason) => {
  if (session.status === 'PAID') return session;
  session.status = 'FAILED';
  session.failureReason = reason || 'Payment failed';
  await session.save();
  await Subscription.updateOne(
    { user: session.user, razorpayOrderId: session.razorpayOrderId, status: 'PENDING' },
    { $set: { status: 'FAILED' } }
  );
  return session;
};

const markCancelled = async (session) => {
  if (session.status === 'PAID') return session;
  session.status = 'CANCELLED';
  session.failureReason = 'Cancelled by user';
  await session.save();
  return session;
};

module.exports = {
  PLAN_PRICES,
  publicBaseUrl,
  buildCheckoutUrl,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createSession,
  markPaid,
  markFailed,
  markCancelled,
};
