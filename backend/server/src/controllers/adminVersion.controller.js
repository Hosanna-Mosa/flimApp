const VersionConfig = require('../models/VersionConfig.model');
const { ADMIN_ROLES } = require('../constants/adminRoles');
const { recordAudit, AUDIT_ACTIONS } = require('../utils/auditLog');
const { success, fail } = require('../utils/response');

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

    // Operations may set versions, store URLs and the update copy. The shutdown
    // switch blacks out every client at once, so it stays with super admin even
    // though it arrives on the same request as the fields they are allowed to
    // change. Only an actual change is blocked — resending the current value
    // while editing something else is not an attempt to use it.
    if (
      isShutdown !== undefined &&
      isShutdown !== config.isShutdown &&
      req.user.role !== ADMIN_ROLES.SUPER
    ) {
      return fail(res, 'Only a super admin can turn the app shutdown on or off', 403);
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
    const shutdownBefore = config.isShutdown;
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

    await recordAudit(req, {
      action: AUDIT_ACTIONS.VERSION_CONFIG_UPDATE,
      targetType: 'VersionConfig',
      targetId: config._id,
      summary: `Updated release config — iOS ${config.ios.minimumVersion}+, Android ${config.android.minimumVersion}+`,
      meta: { ios: config.ios, android: config.android, title, message },
    });

    // The kill switch blacks out every client, so it gets its own entry rather
    // than being buried in a config diff.
    if (isShutdown !== undefined && isShutdown !== shutdownBefore) {
      await recordAudit(req, {
        action: AUDIT_ACTIONS.APP_SHUTDOWN_TOGGLE,
        targetType: 'VersionConfig',
        targetId: config._id,
        summary: isShutdown
          ? 'Enabled app shutdown — all clients blocked'
          : 'Disabled app shutdown — clients restored',
        meta: { isShutdown, shutdownTitle: config.shutdownTitle, shutdownMessage: config.shutdownMessage },
      });
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
