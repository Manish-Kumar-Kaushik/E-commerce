import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { ensureDefaultAdminExists } from '../services/adminBootstrapService.js';
import logger from './logger.js';

const run = async () => {
  try {
    const connected = await connectDB();

    if (!connected || mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected. Set MONGO_URI and run again.');
    }

    const result = await ensureDefaultAdminExists();

    logger.info('Default admin check completed', result);
    process.exit(0);
  } catch (error) {
    logger.error(`Default admin check failed: ${error.message}`);
    process.exit(1);
  }
};

run();
