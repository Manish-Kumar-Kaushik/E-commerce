import '../config/env.js';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import connectDB from '../config/db.js';
import { createVendor } from '../services/vendorService.js';
import logger from './logger.js';

const DEFAULT_VENDOR = {
  name: 'Vendor User',
  email: 'vendor@example.com',
  password: 'vendor123',
  phone: '8888888888',
  role: 'vendor',
  businessName: 'Demo Vendor Store',
  businessPhone: '8888888888',
  businessAddress: {
    line1: 'Vendor Street 1',
    city: 'Delhi',
    state: 'Delhi',
    postalCode: '110001',
    country: 'India',
  },
};

const ensureDefaultVendorExists = async () => {
  const existingUser = await User.findOne({ email: DEFAULT_VENDOR.email }).select('_id role email name');

  if (existingUser && existingUser.role !== 'vendor') {
    throw new Error(`A non-vendor account already exists for ${DEFAULT_VENDOR.email}`);
  }

  if (!existingUser) {
    const user = await User.create({
      name: DEFAULT_VENDOR.name,
      email: DEFAULT_VENDOR.email,
      password: DEFAULT_VENDOR.password,
      phone: DEFAULT_VENDOR.phone,
      role: 'vendor',
      authIdentityKey: DEFAULT_VENDOR.email,
      authProvider: 'email-password',
      loginIdentities: [
        {
          provider: 'email-password',
          identityKey: DEFAULT_VENDOR.email,
          email: DEFAULT_VENDOR.email,
          phone: DEFAULT_VENDOR.phone,
          source: 'seed',
          isPrimary: true,
          verifiedAt: new Date(),
        },
      ],
      lastLoginAt: new Date(),
    });

    await createVendor(user._id, {
      businessName: DEFAULT_VENDOR.businessName,
      businessPhone: DEFAULT_VENDOR.businessPhone,
      businessAddress: DEFAULT_VENDOR.businessAddress,
    });

    logger.info('Default vendor created', {
      email: DEFAULT_VENDOR.email,
      status: 'pending',
    });

    return { created: true, email: DEFAULT_VENDOR.email, status: 'pending' };
  }

  const existingVendor = await Vendor.findOne({ user: existingUser._id }).select('_id status');

  if (!existingVendor) {
    await createVendor(existingUser._id, {
      businessName: DEFAULT_VENDOR.businessName,
      businessPhone: DEFAULT_VENDOR.businessPhone,
      businessAddress: DEFAULT_VENDOR.businessAddress,
    });

    logger.info('Default vendor profile created for existing vendor user', {
      email: DEFAULT_VENDOR.email,
      status: 'pending',
    });

    return { created: true, email: DEFAULT_VENDOR.email, status: 'pending' };
  }

  logger.info('Default vendor already exists', {
    email: DEFAULT_VENDOR.email,
    status: existingVendor.status,
  });

  return { created: false, email: DEFAULT_VENDOR.email, status: existingVendor.status };
};

const run = async () => {
  try {
    const connected = await connectDB();

    if (!connected || mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected. Set MONGO_URI and run again.');
    }

    const result = await ensureDefaultVendorExists();

    logger.info('Default vendor check completed', result);
    process.exit(0);
  } catch (error) {
    logger.error(`Default vendor check failed: ${error.message}`);
    process.exit(1);
  }
};

run();
