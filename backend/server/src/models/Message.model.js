const { Schema, model, Types } = require('mongoose');

const MessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Types.ObjectId, ref: 'User', required: true },
    // Encrypted payload is larger than plaintext; allow room for overhead.
    content: { type: String, required: true, maxlength: 8000 },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('Message', MessageSchema);

