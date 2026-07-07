const { Schema, model, Types } = require('mongoose');

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    actor: { type: Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'general' },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object },
  },
  { timestamps: true }
);

// Automatically delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = model('Notification', NotificationSchema);

