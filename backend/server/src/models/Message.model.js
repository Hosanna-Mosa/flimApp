const { Schema, model, Types } = require('mongoose');

const MessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Types.ObjectId, ref: 'User', required: true },
    // Encrypted payload is larger than plaintext; allow room for overhead.
    /**
     * No longer required: a photo or video may be sent with no caption. The
     * controller enforces that a message carries text, media, or both, since
     * a record with neither is not a message.
     */
    content: { type: String, default: '', maxlength: 8000 },

    /**
     * Attached photo or video. Uploaded straight to Cloudinary by the client
     * with a signed request, so the file never passes through this server;
     * only the resulting URLs are stored.
     *
     * publicId is kept so the file can be removed from Cloudinary when the
     * message is deleted — without it, storage is paid for forever on media
     * nobody can reach.
     */
    media: {
      url: { type: String },
      type: { type: String, enum: ['image', 'video'] },
      thumbnail: { type: String },
      publicId: { type: String },
      size: { type: Number },
      width: { type: Number },
      height: { type: Number },
      /** Seconds, video only. */
      duration: { type: Number },
    },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('Message', MessageSchema);

