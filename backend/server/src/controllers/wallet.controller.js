const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Rbm66o8JPEj0P8',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'fbze5Ra1MSS1ExDE5tlszK22',
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
    console.log('[Wallet] Creating payment order for amount:', amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // amount in the smallest currency unit
      currency: 'INR',
      receipt: `wd_${req.user.id.toString().slice(-10)}_${Date.now()}`,
    };

    console.log('[Wallet] Razorpay options:', options);

    const order = await razorpay.orders.create(options);
    console.log('[Wallet] Order created successfully:', order.id);

    res.status(200).json({
      ...order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_Rbm66o8JPEj0P8'
    });
  } catch (error) {
    console.error('Create order error details:', error);
    const errorMessage = error.error ? error.error.description : (error.description || error.message);
    res.status(500).json({ message: `Failed to create payment order: ${errorMessage || 'Unknown error'}` });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const isSimulated = razorpay_signature === 'simulated_success' && process.env.NODE_ENV === 'development';
    
    let isVerified = false;
    if (isSimulated) {
      isVerified = true;
    } else {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      isVerified = expectedSignature === razorpay_signature;
    }

    if (isVerified) {
      // Payment is verified
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const depositAmount = parseFloat(amount);
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
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || user.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.walletBalance -= amount;
    await user.save();

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
