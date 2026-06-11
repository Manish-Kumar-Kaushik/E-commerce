import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import logger from './logger.js';

dotenv.config();

const PROTECTED_COLLECTIONS = new Set(['admins']);

const clearMongoDataKeepAdmin = async () => {
  try {
    const connected = await connectDB();

    if (!connected || mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected. Set MONGO_URI and run again.');
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    let totalDeleted = 0;
    const summary = [];

    for (const { name } of collections) {
      if (!name || name.startsWith('system.')) {
        continue;
      }

      if (PROTECTED_COLLECTIONS.has(name)) {
        summary.push({ collection: name, deleted: 0, skipped: true });
        continue;
      }

      const result = await db.collection(name).deleteMany({});
      const deleted = result?.deletedCount || 0;
      totalDeleted += deleted;
      summary.push({ collection: name, deleted, skipped: false });
    }

    logger.info('MongoDB data cleared (admin data preserved)', {
      protectedCollections: [...PROTECTED_COLLECTIONS],
      collectionsProcessed: summary.length,
      totalDeleted,
      summary,
    });

    process.exit(0);
  } catch (error) {
    logger.error(`Mongo clear (keep admin) failed: ${error.message}`);
    process.exit(1);
  }
};

clearMongoDataKeepAdmin();
