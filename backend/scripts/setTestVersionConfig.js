require('dotenv').config();
const mongoose = require('mongoose');
const VersionConfig = require('../server/src/models/VersionConfig.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flim-app';

const run = async () => {
  const mode = process.argv[2] || 'force';
  
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  
  // Clear any existing version config
  await VersionConfig.deleteMany({});
  
  let configData = {};
  
  if (mode === 'force') {
    // Current app version is 1.0.0. Setting minimum required to 1.1.0 triggers Force Update!
    configData = {
      ios: {
        latestVersion: '1.2.0',
        minimumVersion: '1.1.0',
        storeUrl: 'https://apps.apple.com/app/id123456789'
      },
      android: {
        latestVersion: '1.2.0',
        minimumVersion: '1.1.0',
        storeUrl: 'https://play.google.com/store/apps/details?id=app.rork.filmy'
      },
      title: 'Critical Update Required',
      message: 'A critical update is required to resolve security patches and keep FlimApp running smoothly. Please update now.'
    };
    console.log('Setting database config to trigger FORCE UPDATE modal...');
  } else if (mode === 'optional') {
    // Current app is 1.0.0. Setting min to 0.9.0 and latest to 1.1.0 triggers Optional Update!
    configData = {
      ios: {
        latestVersion: '1.1.0',
        minimumVersion: '0.9.0',
        storeUrl: 'https://apps.apple.com/app/id123456789'
      },
      android: {
        latestVersion: '1.1.0',
        minimumVersion: '0.9.0',
        storeUrl: 'https://play.google.com/store/apps/details?id=app.rork.filmy'
      },
      title: 'New Update Available',
      message: 'We have added exciting new features and UI enhancements. Check it out!'
    };
    console.log('Setting database config to trigger OPTIONAL UPDATE modal...');
  } else {
    // Reset - matching version 1.0.0 triggers no pop-up
    configData = {
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
    };
    console.log('Resetting database config to matches current app version (No pop-up)...');
  }
  
  await VersionConfig.create(configData);
  console.log('✅ Version Configuration updated successfully!');
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
