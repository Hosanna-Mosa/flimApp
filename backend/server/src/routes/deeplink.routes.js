const express = require('express');
const deeplinkController = require('../controllers/deeplink.controller');

const router = express.Router();

// Both files are fetched by the OS itself, with no app session and no cookies.
// They are public by definition — the whole mechanism is the domain making a
// public statement about which app it trusts.
router.get('/.well-known/apple-app-site-association', deeplinkController.appleAppSiteAssociation);
// Some older iOS versions and a few link checkers look for it at the root too.
router.get('/apple-app-site-association', deeplinkController.appleAppSiteAssociation);
router.get('/.well-known/assetlinks.json', deeplinkController.assetLinks);

router.get('/health/deeplinks', deeplinkController.deeplinkHealth);

// The shareable screens. These paths are the contract: they are what the app
// advertises in its intent filters and what buildPostShareUrl() produces, so
// they change here and in app/utils/deepLinks.ts together or not at all.
router.get('/post/:id', deeplinkController.postPage);
router.get('/user/:id', deeplinkController.userPage);

module.exports = router;
