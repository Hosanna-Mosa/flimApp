const User = require('../models/User.model');

const getMe = async (userId) => User.findById(userId).select('-password -refreshTokens');

const updateMe = async (userId, payload) =>
  User.findByIdAndUpdate(userId, payload, { new: true }).select(
    '-password -refreshTokens'
  );

const getById = async (id) => User.findById(id).select('-password -refreshTokens');

const search = async ({ q, roles, industries }) => {
  const query = {};
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
    ];
  }
  if (roles?.length) query.roles = { $in: roles };
  if (industries?.length) query.industries = { $in: industries };

  return User.find(query).select('name avatar roles industries location bio');
};

module.exports = { getMe, updateMe, getById, search };

