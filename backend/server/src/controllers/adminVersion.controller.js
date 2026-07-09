const VersionConfig = require('../models/VersionConfig.model');
const { success } = require('../utils/response');

const getVersionConfig = async (req, res, next) => {
  try {
    let config = await VersionConfig.findOne({});
    if (!config) {
      config = await VersionConfig.create({
        ios: {
          latestVersion: '1.0.0',
          minimumVersion: '1.0.0',
          storeUrl: 'https://apps.apple.com'
        },
        android: {
          latestVersion: '1.0.0',
          minimumVersion: '1.0.0',
          storeUrl: 'https://play.google.com'
        }
      });
    }
    return success(res, config, 200);
  } catch (err) {
    return next(err);
  }
};

const updateVersionConfig = async (req, res, next) => {
  try {
    const { ios, android, title, message, isShutdown, shutdownTitle, shutdownMessage } = req.body;
    
    let config = await VersionConfig.findOne({});
    if (!config) {
      config = new VersionConfig();
    }
    
    if (ios) {
      config.ios = {
        latestVersion: ios.latestVersion || config.ios.latestVersion,
        minimumVersion: ios.minimumVersion || config.ios.minimumVersion,
        storeUrl: ios.storeUrl || config.ios.storeUrl,
      };
    }
    
    if (android) {
      config.android = {
        latestVersion: android.latestVersion || config.android.latestVersion,
        minimumVersion: android.minimumVersion || config.android.minimumVersion,
        storeUrl: android.storeUrl || config.android.storeUrl,
      };
    }
    
    if (title !== undefined) config.title = title;
    if (message !== undefined) config.message = message;
    if (isShutdown !== undefined) config.isShutdown = isShutdown;
    if (shutdownTitle !== undefined) config.shutdownTitle = shutdownTitle;
    if (shutdownMessage !== undefined) config.shutdownMessage = shutdownMessage;
    
    await config.save();

    // Broadcast shutdown state to active client connections if shutdown is enabled
    if (config.isShutdown) {
      try {
        const { getIo } = require('../utils/socketStore');
        const io = getIo();
        if (io) {
          io.emit('app_shutdown', {
            title: config.shutdownTitle,
            message: config.shutdownMessage,
          });
        }
      } catch (socketErr) {
        console.error('Failed to broadcast app_shutdown socket event:', socketErr);
      }
    }

    return success(res, config, 200);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getVersionConfig,
  updateVersionConfig,
};
