const { Schema, model, Types } = require('mongoose');

const SubscriptionSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    planType: {
      type: String,
      enum: ['1_MONTH', '3_MONTHS', '6_MONTHS', '9_MONTHS'],
      required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'],
      default: 'PENDING'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

// Indexes
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });

module.exports = model('Subscription', SubscriptionSchema);
