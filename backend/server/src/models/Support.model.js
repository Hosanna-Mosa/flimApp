const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Support', supportSchema);
