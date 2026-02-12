import mongoose from 'mongoose';
import logger from './logging.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/biography-poc';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default { connectDatabase };
