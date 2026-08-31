const PaymentSession = require('../models/PaymentSession.model');
const paymentService = require('../services/payment.service');
const views = require('../views/payment.views');
const { success } = require('../utils/response');

/**
 * Razorpay web checkout, driven entirely from the system browser.
 *
 * Flow (identical on iOS and Android):
 *   1. app  -> POST /payments/session            (authenticated)
 *   2. app  -> opens checkoutUrl in the browser
 *   3. browser -> GET  /payments/checkout/:token   (public, renders Razorpay)
 *   4. Razorpay -> POST /payments/checkout/:token/callback (browser navigation)
 *   5. browser -> deep link back into the app
 *   6. app  -> GET  /payments/session/:token       (authenticated, authoritative)
 *
 * Step 6 is what the app trusts. Steps 4-5 happen in a browser the app does not
 * control, so the deep-link query string is treated as a hint only.
 */

// The checkout page loads Razorpay's SDK and iframes api.razorpay.com, both of
// which the app-wide helmet CSP (default-src 'self') would block. helmet writes
// the header with res.setHeader, so setting it again here replaces it for this
// response only.
const applyCheckoutCsp = (res) => {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' https:",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://*.razorpay.com https://fonts.googleapis.com",
      "font-src 'self' data: https://*.razorpay.com https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "frame-src 'self' https://*.razorpay.com",
      "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com",
      "form-action 'self' https://*.razorpay.com",
    ].join('; ')
  );
  // helmet's default Cross-Origin-Opener-Policy: same-origin severs
  // window.opener, which some Razorpay methods (netbanking, a few wallets) use
  // to report back from the popup they open.
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  // A checkout page must never be served from cache: the order it carries is
  // single-use.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
};

const appendParams = (url, params) => {
  const separator = url.includes('?') ? '&' : '?';
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `${url}${separator}${query}` : url;
};

/**
 * Sends the browser back to the app once checkout has finished.
 *
 * For app deep links (myapp://, exp://, …) this MUST be an HTTP 302: Chrome
 * Custom Tabs and SFSafariViewController honour a server redirect to a custom
 * scheme (it is the same mechanism OAuth logins rely on), but they silently
 * block a `window.location = 'myapp://…'` fired from page script without a
 * user gesture — which is exactly what the auto-return on the HTML page was
 * doing, leaving the user stuck on "Returning you to FilmyConnect…".
 *
 * For an https return URL (the web build) the HTML page is still the right
 * answer, since there is nothing to hand off to.
 */
const sendBackToApp = (res, session, { status, message } = {}) => {
  const deepLink = appendParams(session.returnUrl, {
    status,
    sessionId: session.token,
    reason: message,
  });
  if (/^https?:\/\//i.test(deepLink)) {
    return res.send(views.returnToAppPage({ deepLink, status, message }));
  }
  res.set('Cache-Control', 'no-store');
  return res.redirect(302, deepLink);
};

const sessionPayload = (session) => ({
  sessionId: session.token,
  status: session.status,
  purpose: session.purpose,
  planType: session.planType,
  amount: session.amount,
  currency: session.currency,
  orderId: session.razorpayOrderId,
  paymentId: session.razorpayPaymentId,
  fulfilled: session.fulfilled,
  failureReason: session.failureReason,
  expiresAt: session.expiresAt,
});

const loadSession = async (token) => {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return PaymentSession.findOne({ token });
};

/** POST /payments/session — authenticated. Creates the order + hosted URL. */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { purpose = 'SUBSCRIPTION', planType, amount, returnUrl } = req.body || {};

    const session = await paymentService.createSession({
      user: req.user,
      purpose,
      planType,
      amount,
      returnUrl,
    });

    return success(res, {
      sessionId: session.token,
      checkoutUrl: paymentService.buildCheckoutUrl(req, session.token),
      orderId: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error('[Payments] Session creation failed:', err.message);
    next(err);
  }
};

/** GET /payments/session/:token — authenticated. The app's source of truth. */
const getSessionStatus = async (req, res, next) => {
  try {
    const session = await loadSession(req.params.token);
    if (!session || String(session.user) !== String(req.user._id)) {
      const err = new Error('Payment session not found');
      err.status = 404;
      throw err;
    }

    // Nothing came back before the window closed — treat as abandoned so the
    // app stops waiting on it.
    if (session.status === 'CREATED' && session.expiresAt < new Date()) {
      session.status = 'EXPIRED';
      await session.save();
    }

    return success(res, sessionPayload(session));
  } catch (err) {
    next(err);
  }
};

/** GET /payments/checkout/:token — public. The page the browser opens. */
const renderCheckout = async (req, res) => {
  applyCheckoutCsp(res);

  const session = await loadSession(req.params.token);
  if (!session) {
    return res.status(404).send(views.invalidSessionPage());
  }

  if (session.status === 'PAID') {
    return sendBackToApp(res, session, { status: 'success' });
  }

  if (session.expiresAt < new Date()) {
    return res.status(410).send(views.invalidSessionPage());
  }

  const base = paymentService.publicBaseUrl(req);
  return res.send(
    views.checkoutPage({
      session,
      keyId: process.env.RAZORPAY_KEY_ID,
      callbackUrl: `${base}/payments/checkout/${session.token}/callback`,
      cancelUrl: `${base}/payments/checkout/${session.token}/cancel`,
    })
  );
};

/**
 * POST (and GET) /payments/checkout/:token/callback — public.
 *
 * Razorpay navigates the browser here after checkout with `redirect: true`.
 * Success posts razorpay_payment_id/order_id/signature; failure posts
 * error[code] / error[description] instead.
 */
const handleCallback = async (req, res) => {
  applyCheckoutCsp(res);

  const session = await loadSession(req.params.token);
  if (!session) {
    return res.status(404).send(views.invalidSessionPage());
  }

  const payload = { ...(req.body || {}), ...(req.query || {}) };
  const paymentId = payload.razorpay_payment_id;
  const signature = payload.razorpay_signature;
  const orderId = payload.razorpay_order_id || session.razorpayOrderId;

  const renderOutcome = (status, message) => sendBackToApp(res, session, { status, message });

  // Razorpay reported a failed attempt.
  if (!paymentId) {
    const description =
      payload['error[description]'] ||
      (payload.error && payload.error.description) ||
      'Payment was not completed';
    await paymentService.markFailed(session, description);
    return renderOutcome('failed', description);
  }

  // The signature is the only thing proving this POST came from Razorpay and
  // not from someone who guessed the callback URL.
  if (orderId !== session.razorpayOrderId) {
    await paymentService.markFailed(session, 'Order mismatch');
    return renderOutcome('failed', 'Payment could not be verified');
  }

  const validSignature = paymentService.verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  });

  if (!validSignature) {
    console.error('[Payments] Invalid signature for session', session.token);
    await paymentService.markFailed(session, 'Invalid payment signature');
    return renderOutcome('failed', 'Payment could not be verified');
  }

  await paymentService.markPaid(session, { paymentId, signature });
  return renderOutcome('success');
};

/** GET /payments/checkout/:token/cancel — public. User dismissed the sheet. */
const handleCancel = async (req, res) => {
  applyCheckoutCsp(res);

  const session = await loadSession(req.params.token);
  if (!session) {
    return res.status(404).send(views.invalidSessionPage());
  }

  await paymentService.markCancelled(session);

  const status = session.status === 'PAID' ? 'success' : 'cancelled';
  return sendBackToApp(res, session, { status });
};

/**
 * POST /payments/webhook — public, signed by Razorpay.
 *
 * The browser callback only fires if the user's browser is still alive to make
 * it. This is the backstop that fulfils a captured payment when the user kills
 * the browser mid-redirect, so the badge still activates.
 *
 * Mounted with express.raw before the JSON body parser: HMAC has to be computed
 * over the exact bytes Razorpay signed.
 */
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('[Payments] Webhook received but RAZORPAY_WEBHOOK_SECRET is unset');
    return res.status(200).json({ received: true, ignored: true });
  }

  if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
    console.error('[Payments] Webhook signature verification failed');
    return res.status(400).json({ received: false });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ received: false });
  }

  try {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const entity =
        event.payload?.payment?.entity || event.payload?.order?.entity || {};
      const orderId = entity.order_id || entity.id;
      const paymentId = entity.id && entity.order_id ? entity.id : undefined;

      const session = await PaymentSession.findOne({ razorpayOrderId: orderId });
      if (session && !session.fulfilled) {
        await paymentService.markPaid(session, {
          paymentId: paymentId || session.razorpayPaymentId,
          signature: session.razorpaySignature,
        });
      }
    } else if (event.event === 'payment.failed') {
      const entity = event.payload?.payment?.entity || {};
      const session = await PaymentSession.findOne({ razorpayOrderId: entity.order_id });
      if (session && session.status === 'CREATED') {
        await paymentService.markFailed(session, entity.error_description || 'Payment failed');
      }
    }
  } catch (err) {
    console.error('[Payments] Webhook handling error:', err);
  }

  // Always 200 on a verified event: a non-2xx makes Razorpay retry, and a
  // fulfilment bug would turn into a retry storm.
  return res.status(200).json({ received: true });
};

module.exports = {
  createCheckoutSession,
  getSessionStatus,
  renderCheckout,
  handleCallback,
  handleCancel,
  handleWebhook,
};
