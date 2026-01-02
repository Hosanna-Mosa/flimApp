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
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
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

module.exports = {
    getAllUsers,
    suspendUser,
    unsuspendUser,
};
