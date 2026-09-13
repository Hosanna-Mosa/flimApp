const mongoose = require('mongoose');
const Post = require('../models/Post.model');
const User = require('../models/User.model');
const logger = require('../config/logger');
const views = require('../views/deeplink.views');
const {
  IOS_TEAM_ID,
  IOS_BUNDLE_ID,
  ANDROID_PACKAGE,
  ANDROID_SHA256_CERT_FINGERPRINTS,
  LINKED_PATHS,
  isConfigured,
} = require('../config/deeplinks');

/**
 * Apple's association file. Fetched by iOS over HTTPS when the app is
 * installed (and periodically after), and compared against the app's real
 * `TeamID.BundleID`.
 *
 * Apple's CDN caches this, so a change here can take up to a day to reach
 * devices that already have the app; a fresh install picks it up immediately.
 * It must be served as JSON with no redirect and no authentication — a 301
 * from http to https on this exact path is a common reason links silently
 * stop opening the app.
 */
exports.appleAppSiteAssociation = (req, res) => {
  const appId = `${IOS_TEAM_ID}.${IOS_BUNDLE_ID}`;
  const paths = LINKED_PATHS.map((p) => p.pattern);

  res.type('application/json').json({
    applinks: {
      // `details` is read newest-format-first by iOS 13+, which wants
      // `appIDs`/`components`; `apps` and the legacy `appID`/`paths` keys are
      // still required for older versions and cost nothing to keep.
      apps: [],
      details: [
        {
          appIDs: [appId],
          appID: appId,
          paths,
          components: LINKED_PATHS.map((p) => ({ '/': p.pattern, comment: p.comment })),
        },
      ],
    },
  });
};

/**
 * Google's equivalent. Android fetches it at install time to decide whether
 * the app may open filmyconnect24.com links without asking the user first.
 *
 * The fingerprint has to be the one the installed APK is actually signed with.
 * For a Play-distributed build that is the *app signing* key from Play Console
 * (not the upload key), which is the detail that most often makes verification
 * fail on release while it worked in testing.
 */
exports.assetLinks = (req, res) => {
  res.type('application/json').json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: ANDROID_SHA256_CERT_FINGERPRINTS,
      },
    },
  ]);
};

/**
 * Reports whether this host can actually vouch for the app.
 *
 * The failure mode being guarded against is silent: with the Team ID or the
 * fingerprints unset, both files above are served happily and every shared
 * link keeps opening a browser. Deployments can watch this instead of
 * discovering it from a user.
 */
exports.deeplinkHealth = (req, res) => {
  res.status(isConfigured() ? 200 : 503).json({
    configured: isConfigured(),
    ios: { teamId: IOS_TEAM_ID ? 'set' : 'missing', bundleId: IOS_BUNDLE_ID },
    android: {
      package: ANDROID_PACKAGE,
      fingerprints: ANDROID_SHA256_CERT_FINGERPRINTS.length,
    },
  });
};

// A crawler gets the meta tags and nothing else: the scripted hand-off to the
// app is pointless for it, and some crawlers follow the store links and end up
// rendering a card for the App Store instead of the post.
const CRAWLER_UA = /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slackbot|twitterbot|linkedinbot|discordbot|embedly|preview/i;

const isCrawler = (req) => CRAWLER_UA.test(req.get('user-agent') || '');

/**
 * Headers for a landing page.
 *
 * The app-wide helmet CSP is `default-src 'self'`, which would drop the inline
 * hand-off script and every Cloudinary image on these pages. helmet writes the
 * header with res.setHeader, so setting it again replaces it for this response
 * only — the same approach the Razorpay checkout page takes.
 *
 * The cache is short and shared: one link pasted into a busy group is fetched
 * by a crawler and then by everyone who taps it, and none of that is
 * viewer-specific, since only public posts are ever rendered.
 */
const setPageHeaders = (res) => {
  res.type('html').set({
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      // Post media and avatars are served from Cloudinary.
      "img-src https: data:",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
    'Cache-Control': 'public, max-age=300',
  });
};

/**
 * `GET /post/:id` — the page a shared post link lands on.
 *
 * Only a public, active post is rendered. Anything else gets the neutral
 * "not available here" page: this URL can be forwarded to anyone, and nothing
 * about the request says who is holding it, so a followers-only post is not
 * something this page is in a position to show.
 */
exports.postPage = async (req, res) => {
  const { id } = req.params;
  const handoff = !isCrawler(req);
  setPageHeaders(res);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send(views.postUnavailablePage(id, handoff));
  }

  try {
    const post = await Post.findById(id)
      .select('caption media mediaUrl thumbnailUrl visibility isActive author')
      .populate('author', 'name username avatar status')
      .lean();

    if (!post || post.isActive === false || post.visibility !== 'public') {
      return res.status(404).send(views.postUnavailablePage(id, handoff));
    }
    if (post.author && post.author.status && post.author.status !== 'active') {
      return res.status(404).send(views.postUnavailablePage(id, handoff));
    }

    return res.status(200).send(
      views.postPage({
        id,
        handoff,
        caption: post.caption,
        // A video's poster frame, falling back to the media itself for images.
        imageUrl: post.media?.thumbnail || post.thumbnailUrl || post.media?.url || post.mediaUrl || null,
        authorName: post.author?.name || post.author?.username,
        authorAvatar: post.author?.avatar,
      })
    );
  } catch (err) {
    logger.error(`[deeplink] post page ${id} failed: ${err.message}`);
    // Still a page, not a JSON error: whoever tapped the link is in a browser,
    // and the app hand-off below the fold is the part that matters to them.
    return res.status(500).send(views.postUnavailablePage(id, handoff));
  }
};

/** `GET /user/:id` — the same, for a shared profile. */
exports.userPage = async (req, res) => {
  const { id } = req.params;
  const handoff = !isCrawler(req);
  setPageHeaders(res);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send(views.userUnavailablePage(id, handoff));
  }

  try {
    const user = await User.findById(id).select('name username avatar bio status').lean();

    if (!user || (user.status && user.status !== 'active')) {
      return res.status(404).send(views.userUnavailablePage(id, handoff));
    }

    return res.status(200).send(
      views.userPage({
        id,
        handoff,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      })
    );
  } catch (err) {
    logger.error(`[deeplink] user page ${id} failed: ${err.message}`);
    return res.status(500).send(views.userUnavailablePage(id, handoff));
  }
};
