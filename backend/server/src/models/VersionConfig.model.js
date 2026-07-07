const { Schema, model } = require('mongoose');

const PlatformConfigSchema = new Schema({
  latestVersion: { type: String, required: true, default: '1.0.0' },
  minimumVersion: { type: String, required: true, default: '1.0.0' },
  storeUrl: { type: String, required: true, default: 'https://example.com' }
}, { _id: false });

const VersionConfigSchema = new Schema(
  {
    ios: { type: PlatformConfigSchema, required: true, default: () => ({}) },
    android: { type: PlatformConfigSchema, required: true, default: () => ({}) },
    title: { type: String, default: 'New Version Available' },
    message: { type: String, default: 'Please update your application to the latest version to access new features.' }
  },
  { timestamps: true }
);

module.exports = model('VersionConfig', VersionConfigSchema);
