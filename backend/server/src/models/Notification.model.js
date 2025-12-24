const { Schema, model, Types } = require('mongoose');

const NotificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'general' },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object },
  },
  { timestamps: true }
);

module.exports = model('Notification', NotificationSchema);

