/**
 * Identity of the mobile app as Apple's and Google's link verifiers see it.
 *
 * A shared https link only opens the app if this domain vouches for it: iOS
 * fetches /.well-known/apple-app-site-association, Android fetches
 * /.well-known/assetlinks.json, and each compares what it finds against the
 * installed app's real signature. A wrong Team ID or a stale SHA-256 does not
 * produce an error anywhere — the link just quietly opens a browser instead,
 * which is why the values live in one place with a note on where each is from.
 */

const IOS_TEAM_ID = process.env.IOS_TEAM_ID || '';

// Matches app.json: expo.ios.bundleIdentifier / expo.android.package.
const IOS_BUNDLE_ID = process.env.IOS_BUNDLE_ID || 'app.rork.filmy';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE || 'app.rork.filmy';

// Play Console → Setup → App integrity → App signing key certificate.
// Comma-separated: builds signed with the *upload* key (internal testing,
// direct APKs) present a different fingerprint than Play-signed installs, and
// both have to be listed or App Links stop verifying on those builds.
const ANDROID_SHA256_CERT_FINGERPRINTS = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS || '')
  .split(',')
  .map((fp) => fp.trim().toUpperCase())
  .filter(Boolean);

// Custom scheme, kept as the fallback for the cases https cannot cover:
// an Android build whose App Links verification has not passed, or an iOS
// user who once chose "open in browser" and broke the association.
const APP_SCHEME = process.env.APP_SCHEME || 'filmyconnect';

/** Origin the app claims. Must be the exact host serving the files above. */
const WEB_ORIGIN = (process.env.DEEPLINK_ORIGIN || 'https://filmyconnect24.com').replace(/\/$/, '');

const APP_STORE_ID = process.env.IOS_APP_STORE_ID || '';
const APP_STORE_URL = APP_STORE_ID
  ? `https://apps.apple.com/app/id${APP_STORE_ID}`
  : 'https://apps.apple.com/app/filmyconnect';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/**
 * The paths the app handles, as one list. Everything downstream is derived
 * from it — the iOS `components`, the Android intent filter documented in
 * docs/DEEP_LINKS.md, and the Express routes — so a new shareable screen is
 * added here once rather than in four places that can drift apart.
 */
const LINKED_PATHS = [
  { pattern: '/post/*', comment: 'A single post' },
  { pattern: '/user/*', comment: 'A profile' },
];

const isConfigured = () => Boolean(IOS_TEAM_ID) || ANDROID_SHA256_CERT_FINGERPRINTS.length > 0;

module.exports = {
  IOS_TEAM_ID,
  IOS_BUNDLE_ID,
  ANDROID_PACKAGE,
  ANDROID_SHA256_CERT_FINGERPRINTS,
  APP_SCHEME,
  WEB_ORIGIN,
  APP_STORE_URL,
  PLAY_STORE_URL,
  LINKED_PATHS,
  isConfigured,
};
