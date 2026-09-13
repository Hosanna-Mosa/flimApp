/**
 * The page a shared FilmyConnect link lands on in a *browser*.
 *
 * On a phone with the app installed this is usually never rendered: the OS
 * recognises the verified https link and hands it straight to the app. It is
 * what everyone else sees — someone on a laptop, someone without the app, and
 * the link crawlers behind WhatsApp/X/Facebook that decide whether a pasted
 * link shows a rich card or a bare URL.
 */

const {
  APP_SCHEME,
  ANDROID_PACKAGE,
  APP_STORE_URL,
  PLAY_STORE_URL,
  WEB_ORIGIN,
} = require('../config/deeplinks');

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

const styles = `
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
  .card { width: 100%; max-width: 420px; }
  .brand {
    display: flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; letter-spacing: 0.02em;
    color: ${BRAND}; margin-bottom: 20px;
  }
  .preview {
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 16px; overflow: hidden; background: #141414; margin-bottom: 24px;
  }
  .preview img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #1e1e1e; }
  .preview .body { padding: 16px; }
  .author { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .author img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: #2a2a2a; }
  .author .name { font-size: 14px; font-weight: 600; }
  .caption { font-size: 15px; line-height: 1.5; color: rgba(255,255,255,0.82); margin: 0; word-break: break-word; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
  p.sub { font-size: 15px; line-height: 1.5; color: rgba(255,255,255,0.6); margin: 0 0 24px; }
  .btn {
    display: block; width: 100%; padding: 15px 20px; border: 0; border-radius: 12px;
    background: ${BRAND}; color: #111; font-size: 16px; font-weight: 700;
    text-align: center; text-decoration: none; cursor: pointer; margin-bottom: 12px;
  }
  .stores { display: flex; gap: 12px; }
  .stores a {
    flex: 1; padding: 13px 12px; border-radius: 12px; text-align: center; text-decoration: none;
    font-size: 14px; font-weight: 600; color: #fff;
    border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.04);
  }
  .hint { font-size: 13px; color: rgba(255,255,255,0.4); text-align: center; margin: 18px 0 0; }
`;

/**
 * Hands the visitor over to the installed app when they ask for it.
 *
 * This only ever runs as a fallback. A verified https link is intercepted by
 * the OS before the browser loads anything, so reaching this page usually
 * means the app is *not* installed — which is why nothing fires automatically.
 * An unhandled scheme on iOS raises a "cannot open the page" dialog, and a
 * silent bounce to a store strands people who tapped a link expecting a post.
 *
 * Each platform gets the mechanism that actually works there:
 *
 * - Android: an `intent://` URL. Chrome opens the app when it is installed and
 *   follows `browser_fallback_url` when it is not, so the decision is made by
 *   the browser with knowledge this page does not have. (The old trick of
 *   pointing a hidden iframe at a custom scheme has not worked in Chrome for
 *   years.)
 * - iOS and everything else: try the scheme, and fall back to the store if the
 *   page is still in the foreground a moment later — if the app had taken over,
 *   the tab would be hidden by now.
 */
const openInAppScript = ({ appUrl, intentUrl }) => `
  (function () {
    var button = document.getElementById('open-app');
    if (!button) return;

    button.addEventListener('click', function (e) {
      e.preventDefault();

      if (/Android/i.test(navigator.userAgent)) {
        window.location.href = ${jsonForScript(intentUrl)};
        return;
      }

      var startedAt = Date.now();
      var toStore = setTimeout(function () {
        // Still here and still in the foreground: nothing took the scheme, so
        // the app is not installed. If it had opened, this tab would be hidden.
        if (document.hidden || Date.now() - startedAt > 2500) return;
        window.location.href = ${jsonForScript(APP_STORE_URL)};
      }, 1500);

      document.addEventListener('visibilitychange', function onHide() {
        if (!document.hidden) return;
        clearTimeout(toStore);
        document.removeEventListener('visibilitychange', onHide);
      });

      window.location.href = ${jsonForScript(appUrl)};
    });
  })();
`;

const layout = ({ title, description, imageUrl, canonicalUrl, appPath, body, handoff = true }) => {
  const appUrl = `${APP_SCHEME}://${appPath}`;
  // Chrome on Android resolves this itself: the app if it is installed, the
  // fallback URL if it is not.
  const intentUrl =
    `intent://${appPath}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE}` +
    `;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

  <meta property="og:site_name" content="FilmyConnect" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ''}
  <meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : ''}

  <style>${styles}</style>
</head>
<body>
  <div class="card">
    <div class="brand">FilmyConnect</div>
    ${body}
    <a class="btn" id="open-app" href="${escapeHtml(appUrl)}">Open in the app</a>
    <div class="stores">
      <a href="${escapeHtml(APP_STORE_URL)}">App Store</a>
      <a href="${escapeHtml(PLAY_STORE_URL)}">Google Play</a>
    </div>
    <p class="hint">Already have FilmyConnect? The link opens it directly.</p>
  </div>
  ${handoff ? `<script>${openInAppScript({ appUrl, intentUrl })}</script>` : ''}
</body>
</html>`;
};

/** Landing page for a public post, with the content the crawlers read. */
const postPage = ({ id, caption, imageUrl, authorName, authorAvatar, handoff }) => {
  const name = authorName || 'Someone';
  const title = caption ? `${name} on FilmyConnect` : `A post by ${name} on FilmyConnect`;
  const description = caption || `See ${name}'s post on FilmyConnect.`;

  return layout({
    title,
    description,
    imageUrl,
    handoff,
    canonicalUrl: `${WEB_ORIGIN}/post/${encodeURIComponent(id)}`,
    appPath: `post/${encodeURIComponent(id)}`,
    body: `
    <div class="preview">
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" />` : ''}
      <div class="body">
        <div class="author">
          ${authorAvatar ? `<img src="${escapeHtml(authorAvatar)}" alt="" />` : ''}
          <span class="name">${escapeHtml(name)}</span>
        </div>
        ${caption ? `<p class="caption">${escapeHtml(caption)}</p>` : ''}
      </div>
    </div>`,
  });
};

/**
 * Shown when the post is missing, deleted, or not public.
 *
 * Deliberately says nothing about which of those it is and shows no content:
 * a link to a followers-only post can be forwarded to anyone, and this page
 * has no idea who is holding it. The app is where the viewer is known, so the
 * decision to show the post is left there.
 */
const postUnavailablePage = (id, handoff) =>
  layout({
    title: 'FilmyConnect',
    description: 'Open this post in FilmyConnect.',
    imageUrl: null,
    handoff,
    canonicalUrl: `${WEB_ORIGIN}/post/${encodeURIComponent(id)}`,
    appPath: `post/${encodeURIComponent(id)}`,
    body: `
    <h1>This post isn't available here</h1>
    <p class="sub">It may have been removed, or it's only visible to the people who follow its author. Open it in FilmyConnect to see whether you have access.</p>`,
  });

/** Landing page for a profile link. */
const userPage = ({ id, name, username, avatar, bio, handoff }) => {
  const displayName = name || username || 'A FilmyConnect member';
  const description = bio || `See ${displayName}'s work on FilmyConnect.`;

  return layout({
    title: `${displayName} on FilmyConnect`,
    description,
    imageUrl: avatar || null,
    handoff,
    canonicalUrl: `${WEB_ORIGIN}/user/${encodeURIComponent(id)}`,
    appPath: `user/${encodeURIComponent(id)}`,
    body: `
    <div class="preview">
      <div class="body">
        <div class="author">
          ${avatar ? `<img src="${escapeHtml(avatar)}" alt="" />` : ''}
          <span class="name">${escapeHtml(displayName)}</span>
        </div>
        ${bio ? `<p class="caption">${escapeHtml(bio)}</p>` : ''}
      </div>
    </div>`,
  });
};

const userUnavailablePage = (id, handoff) =>
  layout({
    title: 'FilmyConnect',
    description: 'Open this profile in FilmyConnect.',
    imageUrl: null,
    handoff,
    canonicalUrl: `${WEB_ORIGIN}/user/${encodeURIComponent(id)}`,
    appPath: `user/${encodeURIComponent(id)}`,
    body: `
    <h1>This profile isn't available here</h1>
    <p class="sub">Open it in FilmyConnect to see whether the account is still active.</p>`,
  });

module.exports = { postPage, postUnavailablePage, userPage, userUnavailablePage };
