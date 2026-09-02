const User = require('../models/User.model');
const { success } = require('../utils/response');
const { recordAudit, AUDIT_ACTIONS } = require('../utils/auditLog');
const { fail } = require('../utils/response');
const Post = require('../models/Post.model');
const { deleteUserCompletely } = require('../services/userDeletion.service');

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

        await recordAudit(req, {
            action: AUDIT_ACTIONS.USER_SUSPEND,
            targetType: 'User',
            targetId: user._id,
            targetLabel: user.name,
            summary: `Set ${user.name} to ${status}${reason ? ` — ${reason}` : ''}`,
            meta: { status, reason, duration, suspendedUntil: updateData.suspendedUntil },
        });

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

        await recordAudit(req, {
            action: AUDIT_ACTIONS.USER_UNSUSPEND,
            targetType: 'User',
            targetId: user._id,
            targetLabel: user.name,
            summary: `Restored ${user.name} to active`,
        });

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

        await recordAudit(req, {
            action: AUDIT_ACTIONS.WALLET_ADJUST,
            targetType: 'User',
            targetId: user._id,
            targetLabel: user.name,
            summary: `${type === 'credit' ? 'Credited' : 'Debited'} ${amount} ${wallet.currency || 'INR'} ${type === 'credit' ? 'to' : 'from'} ${user.name}`,
            meta: {
                type,
                amount: parseFloat(amount),
                description,
                balanceBefore: user.walletBalance - change,
                balanceAfter: user.walletBalance,
            },
        });

        return success(res, { balance: user.walletBalance, transactions: wallet.transactions });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /admin/users/:id/posts — what this person has published.
 *
 * Includes posts already hidden by moderation, which the app's own feed will
 * not return; an admin looking at an account needs to see what was taken down
 * as much as what is live.
 */
const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 12 } = req.query;

        const perPage = Math.min(parseInt(limit, 10) || 12, 50);
        const skip = ((parseInt(page, 10) || 1) - 1) * perPage;

        const [posts, total] = await Promise.all([
            Post.find({ author: id })
                .select('type caption mediaUrl media thumbnailUrl isActive visibility engagement createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .lean(),
            Post.countDocuments({ author: id }),
        ]);

        return success(res, {
            data: posts,
            total,
            page: parseInt(page, 10) || 1,
            limit: perPage,
            totalPages: Math.max(1, Math.ceil(total / perPage)),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /admin/users/:id — erase the account and everything belonging to it.
 *
 * Guarded by a typed confirmation of the account's own email rather than a
 * boolean flag. There is no undo and no backup restore path here, so the cost
 * of a mistaken click is total; requiring the caller to reproduce the email
 * makes that click impossible to make by accident.
 */
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { confirmEmail, reason } = req.body;

        const user = await User.findById(id).select('email name');
        if (!user) return fail(res, 'User not found', 404);

        if (!confirmEmail || String(confirmEmail).trim().toLowerCase() !== user.email.toLowerCase()) {
            return fail(res, "Type the account's email address to confirm deletion", 400);
        }

        const result = await deleteUserCompletely(id);
        if (!result) return fail(res, 'User not found', 404);

        // Written after the fact and holding the counts, because once this
        // returns there is nothing left in the database to reconstruct it from.
        await recordAudit(req, {
            action: AUDIT_ACTIONS.USER_DELETE,
            targetType: 'User',
            targetId: id,
            targetLabel: result.user.name,
            summary: `Permanently deleted ${result.user.name} (${result.user.email}) and all their data`,
            meta: {
                deletedUser: result.user,
                removed: result.removed,
                media: result.media,
                orphanedCommunities: result.orphanedCommunities,
                reason: reason || null,
            },
        });

        return success(res, result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserPosts,
    deleteUser,
    updateWallet,
    suspendUser,
    unsuspendUser,
};
