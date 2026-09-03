const mongoose = require('mongoose');

/**
 * A help request raised from the app's Support screen.
 *
 * Created by support.controller.createSupportRequest, which also emails a copy
 * to SUPPORT_ADMIN_EMAIL. Until the admin desk existed the email was the only
 * way anyone saw a ticket, so nothing was ever marked resolved and no reply
 * reached the user inside the app.
 */
const supportReplySchema = new mongoose.Schema(
    {
        body: { type: String, required: true, maxlength: 4000 },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
        adminName: { type: String, required: true },
        /** How the reply reached the user. 'both' is the default from the desk. */
        channel: { type: String, enum: ['notification', 'email', 'both'], default: 'both' },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const supportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'rejected'],
            default: 'pending',
        },

        /** Replies sent to the user, oldest first. */
        replies: { type: [supportReplySchema], default: [] },

        /** Internal only — never sent to the user. */
        adminNotes: { type: String, maxlength: 2000 },

        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        resolvedByName: { type: String },
        resolvedAt: { type: Date },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    // createdAt is declared above and already populated on existing documents,
    // so only updatedAt is delegated to mongoose.
    { timestamps: { createdAt: false, updatedAt: true } }
);

// The desk is always "open tickets, oldest first".
supportSchema.index({ status: 1, createdAt: 1 });
supportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Support', supportSchema);
