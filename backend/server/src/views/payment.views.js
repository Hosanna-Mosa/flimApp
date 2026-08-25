/**
 * HTML served to the *system browser* during Razorpay web checkout.
 *
 * The mobile app never renders these — it opens the checkout URL in Chrome
 * Custom Tabs (Android) / SFSafariViewController (iOS) and waits for the
 * browser to navigate to the app's deep link, which is what the bridge page
 * below triggers.
 */

const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// JSON destined for a <script> block. `</script>` inside a string would close
// the tag early, and U+2028/9 are literal line terminators in JS source.
const jsonForScript = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .split(String.fromCharCode(0x2028))
    .join('\\u2028')
    .split(String.fromCharCode(0x2029))
    .join('\\u2029');

const BRAND = '#D4AF37';

const baseStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #0b0b0b;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 380px;
    text-align: center;
  }
  .spinner {
    width: 44px;
    height: 44px;
    margin: 0 auto 24px;
    border: 3px solid rgba(255,255,255,0.15);
    border-top-color: ${BRAND};
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p { font-size: 15px; line-height: 1.5; color: #a3a3a3; margin: 0 0 24px; }
  .amount { font-size: 28px; font-weight: 700; color: ${BRAND}; margin: 0 0 4px; }
  .badge {
    width: 64px; height: 64px; line-height: 64px;
    margin: 0 auto 20px;
    border-radius: 50%;
    font-size: 30px;
  }
  .badge.ok   { background: rgba(34,197,94,0.15);  color: #22c55e; }
  .badge.bad  { background: rgba(239,68,68,0.15);  color: #ef4444; }
  .badge.warn { background: rgba(212,175,55,0.15); color: ${BRAND}; }
  a.button, button.button {
    display: block;
    width: 100%;
    padding: 15px 20px;
    border: 0;
    border-radius: 12px;
    background: ${BRAND};
    color: #0b0b0b;
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }
  .hint { font-size: 13px; color: #6b6b6b; margin: 16px 0 0; }
`;

const page = (title, bodyHtml, scriptJs) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="referrer" content="origin">
<title>${escapeHtml(title)}</title>
<style>${baseStyles}</style>
</head>
<body>
<div class="card">${bodyHtml}</div>
${scriptJs ? `<script>${scriptJs}</script>` : ''}
</body>
</html>`;

/**
 * The checkout page. Opens Razorpay immediately on load.
 *
 * `redirect: true` + `callback_url` is deliberate: Razorpay then POSTs the
 * result to our server as a real browser navigation instead of invoking a JS
 * handler. That is the only variant that survives the UPI-intent round trip,
 * where the user leaves the browser for their payment app and comes back to a
 * page that may have been reloaded or restored from cache.
 */
const checkoutPage = ({ session, keyId, callbackUrl, cancelUrl }) => {
  const options = {
    key: keyId,
    order_id: session.razorpayOrderId,
    amount: session.amountPaise,
    currency: session.currency || 'INR',
    name: 'FilmyConnect',
    description:
      session.purpose === 'SUBSCRIPTION'
        ? `Verification Badge - ${session.planType}`
        : 'Wallet Top-up',
    image: 'https://filmyconnect24.com/favicon.ico',
    prefill: {
      name: session.prefill?.name || '',
      email: session.prefill?.email || '',
      contact: session.prefill?.contact || '',
    },
    notes: { sessionToken: session.token },
    theme: { color: BRAND },
    callback_url: callbackUrl,
    redirect: true,
  };

  const body = `
    <div class="spinner" id="spinner"></div>
    <div class="amount">&#8377;${escapeHtml(session.amount)}</div>
    <h1 id="heading">Opening secure checkout</h1>
    <p id="subheading">Complete your payment with Razorpay. You will return to the app automatically.</p>
    <button class="button" id="retry" style="display:none" onclick="startCheckout()">Retry payment</button>
    <p class="hint" id="hint"></p>
  `;

  const script = `
    var OPTIONS = ${jsonForScript(options)};
    var CANCEL_URL = ${jsonForScript(cancelUrl)};
    var launched = false;

    function showError(message) {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('heading').textContent = 'Could not open checkout';
      document.getElementById('subheading').textContent = message;
      document.getElementById('retry').style.display = 'block';
    }

    function startCheckout() {
      if (typeof Razorpay === 'undefined') {
        showError('Payment gateway did not load. Check your connection and try again.');
        return;
      }
      try {
        document.getElementById('retry').style.display = 'none';
        var opts = JSON.parse(JSON.stringify(OPTIONS));
        // Dismissing the sheet is a real outcome the app has to hear about,
        // otherwise it sits on a spinner until the browser is force-closed.
        opts.modal = {
          escape: false,
          ondismiss: function () { window.location.replace(CANCEL_URL); }
        };
        var rzp = new Razorpay(opts);
        rzp.on('payment.failed', function () {
          // redirect:true makes Razorpay post failures to callback_url too, so
          // nothing to do here beyond letting that navigation happen.
        });
        rzp.open();
        launched = true;
      } catch (e) {
        showError(e && e.message ? e.message : 'Unexpected error');
      }
    }

    function onSdkError() {
      showError('Payment gateway could not be reached.');
    }

    // Safety net: if onload never fires (flaky network, cached script), try once
    // more after a beat rather than leaving a dead spinner on screen.
    setTimeout(function () {
      if (!launched) {
        if (typeof Razorpay !== 'undefined') startCheckout();
        else showError('Payment gateway is taking too long to load.');
      }
    }, 8000);
  `;

  const html = page('Secure Payment', body, script).replace(
    '</body>',
    `<script src="https://checkout.razorpay.com/v1/checkout.js" onload="startCheckout()" onerror="onSdkError()"></script>\n</body>`
  );

  return html;
};

/**
 * Terminal page: hands control back to the app.
 *
 * openAuthSessionAsync watches for a navigation to the app's redirect URL, so
 * `location.replace` is what actually closes the browser tab and resumes the
 * app. The visible button covers the case where the user landed here in a plain
 * browser (deep link blocked, session already dismissed).
 */
const returnToAppPage = ({ deepLink, status, message }) => {
  const copy = {
    success: { badge: 'ok', icon: '&#10003;', title: 'Payment successful', text: message || 'Returning you to FilmyConnect...' },
    failed: { badge: 'bad', icon: '&#10005;', title: 'Payment failed', text: message || 'No money was deducted. You can try again from the app.' },
    cancelled: { badge: 'warn', icon: '&#8592;', title: 'Payment cancelled', text: message || 'You closed the payment before it completed.' },
    pending: { badge: 'warn', icon: '&#8987;', title: 'Payment processing', text: message || 'We are still confirming this payment with your bank.' },
  }[status] || { badge: 'warn', icon: '&#8987;', title: 'Payment update', text: message || '' };

  const body = `
    <div class="badge ${copy.badge}">${copy.icon}</div>
    <h1>${escapeHtml(copy.title)}</h1>
    <p>${escapeHtml(copy.text)}</p>
    <a class="button" id="return" href="${escapeHtml(deepLink)}">Return to app</a>
    <p class="hint">If nothing happens, tap the button above.</p>
  `;

  const script = `
    var DEEP_LINK = ${jsonForScript(deepLink)};
    setTimeout(function () {
      try { window.location.replace(DEEP_LINK); } catch (e) { window.location.href = DEEP_LINK; }
    }, 150);
  `;

  return page(copy.title, body, script);
};

/** Shown when the session token is unknown, expired, or already consumed. */
const invalidSessionPage = (message) =>
  page(
    'Session expired',
    `
      <div class="badge warn">&#9888;</div>
      <h1>Payment session expired</h1>
      <p>${escapeHtml(message || 'This payment link is no longer valid. Please start the payment again from the app.')}</p>
    `
  );

module.exports = {
  checkoutPage,
  returnToAppPage,
  invalidSessionPage,
};
