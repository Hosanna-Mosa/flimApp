const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription.model');
const User = require('../models/User.model');
const { success } = require('../utils/response');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

const PLAN_PRICES = {
  '1_MONTH': 499,
  '3_MONTHS': 1299,
  '6_MONTHS': 2199,
  '9_MONTHS': 2999,
};

const createOrder = async (req, res, next) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    console.log(`[Subscription] Creating order - User: ${userId}, Plan: ${planType}`);

    if (!PLAN_PRICES[planType]) {
      console.log(`[Subscription] Invalid plan type: ${planType}`);
      const err = new Error('Invalid plan type');
      err.status = 400;
      throw err;
    }

    const amount = PLAN_PRICES[planType];
    
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${userId.toString().slice(-10)}_${Date.now()}`,
    };

    console.log(`[Subscription] Razorpay options:`, JSON.stringify(options));

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (rzpErr) {
      console.error('[Subscription] Razorpay API Error:', rzpErr);
      const errorDesc = rzpErr.error ? rzpErr.error.description : (rzpErr.description || rzpErr.message);
      throw new Error(`Razorpay Error: ${errorDesc || 'Unknown Razorpay error'}`);
    }

    console.log(`[Subscription] Order created: ${order.id}`);

    // Clean up any existing PENDING subscriptions for this user to avoid duplication
    await Subscription.deleteMany({ user: userId, status: 'PENDING' });

    // Create a NEW pending subscription record
    await Subscription.create({
      user: userId,
      planType,
      amount,
      razorpayOrderId: order.id,
      status: 'PENDING',
    });

    return success(res, {
      orderId: order.id,
      amount: options.amount,
      currency: options.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (err) {
    console.error('[Subscription] Order creation failed:', err);
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    const userId = req.user.id;

    // Verify signature
    const isSimulated = razorpay_signature === 'simulated_success' && process.env.NODE_ENV === 'development';
    
    if (!isSimulated) {
      const text = razorpay_order_id + '|' + razorpay_payment_id;
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder')
        .update(text)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        const err = new Error('Invalid payment signature');
        err.status = 400;
        throw err;
      }
    } else {
      console.log(`[Subscription] Simulated success bypass for user ${userId}`);
    }

    // Update subscription
    const subscription = await Subscription.findOne({ 
      user: userId, 
      razorpayOrderId: razorpay_order_id 
    });

    if (!subscription) {
      const err = new Error('Subscription record not found');
      err.status = 404;
      throw err;
    }

    const startDate = new Date();
    let durationMonths = 0;
    if (subscription.planType === '1_MONTH') durationMonths = 1;
    else if (subscription.planType === '3_MONTHS') durationMonths = 3;
    else if (subscription.planType === '6_MONTHS') durationMonths = 6;
    else if (subscription.planType === '9_MONTHS') durationMonths = 9;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    subscription.status = 'ACTIVE';
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.razorpaySignature = razorpay_signature;
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    await subscription.save();

    // Update user status
    await User.findByIdAndUpdate(userId, {
      isVerified: true,
      verifiedUntil: endDate,
      verificationStatus: 'active'
    });

    // Final clean up: remove any other pending attempts for this user
    await Subscription.deleteMany({ user: userId, status: 'PENDING', _id: { $ne: subscription._id } });

    return success(res, { 
      message: 'Payment verified successfully and badge activated',
      subscription
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
