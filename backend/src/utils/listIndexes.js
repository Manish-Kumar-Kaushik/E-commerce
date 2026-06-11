import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const listIndexes = async () => {
  await connectDB();
  
  const db = mongoose.connection.db;
  const indexes = await db.collection('products').indexes();
  
  console.log('Current indexes on products collection:');
  indexes.forEach(idx => {
    console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
  });
  
  process.exit(0);
};

listIndexes();