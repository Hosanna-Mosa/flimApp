const User = require('../models/User.model');
const { success } = require('../utils/response');

const getBoostStats = async (req, res, next) => {
    try {
        const boostedUsers = await User.find({ isBoosted: true })
            .select('name email phone boostedUntil avatar')
            .sort({ boostedUntil: -1 });

        const totalBoosted = boostedUsers.length;

        return success(res, {
            count: totalBoosted,
            users: boostedUsers,
        });
    } catch (err) {
        next(err);
    }
};

const getWalletStats = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .select('name email walletBalance avatar')
            .sort({ walletBalance: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments(query);
        
        // Total platform balance
        const totalBalance = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$walletBalance" } } }
        ]);

        return success(res, {
            data: users,
            platformTotal: totalBalance.length > 0 ? totalBalance[0].total : 0,
            total: totalUsers,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalUsers / limit),
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBoostStats,
    getWalletStats,
};
