const Community = require('../models/Community.model');

const createCommunity = async (payload, creatorId) =>
  Community.create({ ...payload, createdBy: creatorId, members: [creatorId] });

const listCommunities = async () => Community.find({}).lean();

const getCommunity = async (id) => Community.findById(id).lean();

const joinCommunity = async (id, userId) =>
  Community.findByIdAndUpdate(
    id,
    { $addToSet: { members: userId } },
    { new: true }
  );

const leaveCommunity = async (id, userId) =>
  Community.findByIdAndUpdate(id, { $pull: { members: userId } }, { new: true });

module.exports = {
  createCommunity,
  listCommunities,
  getCommunity,
  joinCommunity,
  leaveCommunity,
};

