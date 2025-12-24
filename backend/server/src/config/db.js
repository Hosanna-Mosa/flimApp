const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async (uri) => {
  try {
    const dbcon = await mongoose.connect(uri);
    logger.info(`MongoDB connected :${dbcon.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

