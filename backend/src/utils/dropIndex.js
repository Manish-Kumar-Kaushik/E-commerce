import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const dropIndex = async () => {
  await connectDB();
  
  const db = mongoose.connection.db;
  
  try {
    await db.collection('products').dropIndex('name_text_category_1_collectionSlug_1_tags_1');
    console.log('Old text index dropped successfully');
  } catch (e) {
    if (e.codeName === 'IndexNotFound') {
      console.log('Index not found, may already be removed');
    } else {
      console.error('Error dropping index:', e.message);
    }
  }
  
  process.exit(0);
};

dropIndex();