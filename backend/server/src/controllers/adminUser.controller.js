const User = require('../models/User.model');
const { success, error } = require('../utils/response');

const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status, role } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (role && role !== 'all') {
            query.roles = role;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        return success(res, {
            data: users,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        next(err);
    }
};

const suspendUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, reason, duration } = req.body; // duration in days (for temp suspension)

        if (!['suspended', 'banned'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = {
            status,
            suspensionReason: reason,
            suspendedUntil: null,
        };

        if (status === 'suspended' && duration) {
            const suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(duration));
            updateData.suspendedUntil = suspendedUntil;
        }

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return success(res, user, 200);
    } catch (err) {
        next(err);
    }
};

const unsuspendUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            {
                status: 'active',
                suspensionReason: null,
                suspendedUntil: null,
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return success(res, user, 200);
    } catch (err) {
        next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return success(res, user);
    } catch (err) {
        next(err);
    }
};

const updateWallet = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, type, description } = req.body; // type: 'credit' or 'debit'

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const change = type === 'credit' ? parseFloat(amount) : -parseFloat(amount);
        user.walletBalance = (user.walletBalance || 0) + change;
        await user.save();

        // Also update Wallet model
        const Wallet = require('../models/Wallet.model');
        let wallet = await Wallet.findOne({ user: id });
        if (!wallet) {
            wallet = new Wallet({ user: id, balance: user.walletBalance });
        } else {
            wallet.balance = user.walletBalance;
        }

        wallet.transactions.push({
            type,
            amount: parseFloat(amount),
            description: description || `Admin adjustment: ${type}`,
            reference: `admin_${Date.now()}`
        });

        await wallet.save();

        return success(res, { balance: user.walletBalance, transactions: wallet.transactions });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateWallet,
    suspendUser,
    unsuspendUser,
};
