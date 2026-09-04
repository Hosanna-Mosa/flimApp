const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also fetch transaction history from Wallet model if exists
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: user.walletBalance || 0 });
    }

    res.status(200).json({
      balance: user.walletBalance || 0,
      transactions: wallet.transactions || [],
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // amount in the smallest currency unit
      currency: 'INR',
      receipt: `wd_${req.user.id.toString().slice(-10)}_${Date.now()}`,
    };


    const order = await razorpay.orders.create(options);

    res.status(200).json({
      ...order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error details:', error);
    const errorMessage = error.error ? error.error.description : (error.description || error.message);
    res.status(500).json({ message: `Failed to create payment order: ${errorMessage || 'Unknown error'}` });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment parameters' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const sigBuf = Buffer.from(String(razorpay_signature));
    const expBuf = Buffer.from(expectedSignature);
    const isBadgeVerified =
      sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (isBadgeVerified) {
      // Payment is verified
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Never trust a client-supplied amount: read what was actually captured.
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (!order || order.status !== 'paid') {
        return res.status(400).json({ message: 'Payment not captured' });
      }

      // Replay guard: a payment id may only ever be credited once.
      const existing = await Wallet.findOne({
        user: req.user.id,
        'transactions.reference': razorpay_payment_id,
      });
      if (existing) {
        return res.status(409).json({ message: 'Payment already processed' });
      }

      const depositAmount = order.amount_paid / 100;
      user.walletBalance = (user.walletBalance || 0) + depositAmount;
      await user.save();

      // Update Wallet model for transaction history
      let wallet = await Wallet.findOne({ user: req.user.id });
      if (!wallet) {
        wallet = new Wallet({ user: req.user.id, balance: user.walletBalance });
      } else {
        wallet.balance = user.walletBalance;
      }
      
      wallet.transactions.push({
        type: 'credit',
        amount: depositAmount,
        description: 'Wallet Deposit',
        reference: razorpay_payment_id,
      });

      await wallet.save();

      res.status(200).json({
        message: 'Payment verified and wallet updated',
        balance: user.walletBalance,
      });
    } else {
      res.status(400).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    // A negative or non-numeric amount would otherwise pass the balance check
    // and *increase* the balance on subtraction.
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Atomic conditional deduction closes the concurrent-withdrawal race.
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount } },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: user.walletBalance });
    } else {
      wallet.balance = user.walletBalance;
    }

    wallet.transactions.push({
      type: 'debit',
      amount: amount,
      description: 'Wallet Withdrawal',
    });

    await wallet.save();

    res.status(200).json({
      message: 'Withdrawal successful',
      balance: user.walletBalance,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
