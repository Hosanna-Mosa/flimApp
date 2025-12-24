const { Schema, model, Types } = require('mongoose');

const TransactionSchema = new Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    reference: { type: String },
  },
  { timestamps: true }
);

const WalletSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    transactions: [TransactionSchema],
  },
  { timestamps: true }
);

module.exports = model('Wallet', WalletSchema);

