import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import {
  findAdminByIdLocal,
  findUserByIdLocal,
  findUserByEmailLocal,
  LOCAL_ADMIN_USER_ID,
  LOCAL_DEMO_USER_ID,
  LOCAL_VENDOR_USER_ID,
  shouldUseLocalStore,
} from '../services/localStoreService.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const isDevelopmentMode = process.env.NODE_ENV !== 'production';

const demoAdminUser = {
  _id: LOCAL_ADMIN_USER_ID,
  name: 'Demo Admin',
  email: 'admin@example.com',
  role: 'admin',
  isDemoSession: true,
};

const demoVendorUser = {
  _id: LOCAL_VENDOR_USER_ID,
  name: 'Demo Vendor',
  email: 'vendor@example.com',
  role: 'vendor',
  isDemoSession: true,
};

const getDevelopmentDemoUser = (token) => {
  if (!isDevelopmentMode) {
    return null;
  }

  if (token?.startsWith('demo-admin-token')) {
    return demoAdminUser;
  }

  if (token?.startsWith('demo-user-token')) {
    return {
      _id: LOCAL_DEMO_USER_ID,
      name: 'Demo User',
      email: 'user@example.com',
      role: 'customer',
      isDemoSession: true,
    };
  }

  if (token?.startsWith('demo-vendor-token')) {
    return demoVendorUser;
  }

  return null;
};

export const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    if (shouldUseLocalStore() && req.originalUrl.startsWith('/api/admin/')) {
      req.user = demoAdminUser;
      next();
      return;
    }

    throw new ApiError(401, 'Authorization token is required');
  }

  const token = authorization.split(' ')[1];
  const demoUser = getDevelopmentDemoUser(token);

  if (demoUser) {
    req.user = demoUser;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');

    if (shouldUseLocalStore()) {
      const localUser = decoded.role === 'admin'
        ? await findAdminByIdLocal(decoded.userId)
        : await findUserByIdLocal(decoded.userId);

      if (localUser) {
        req.user = {
          _id: localUser._id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          authIdentityKey: localUser.authIdentityKey,
          authProvider: localUser.authProvider,
          isDemoSession: true,
        };
        req.auth = { userId: localUser._id };
        next();
        return;
      }

      if (decoded.role === 'admin') {
        req.user = demoAdminUser;
        req.auth = { userId: demoAdminUser._id };
        next();
        return;
      }

      if (decoded.role === 'vendor') {
        req.user = demoVendorUser;
        req.auth = { userId: demoVendorUser._id };
        next();
        return;
      }
    }

    const user = decoded.role === 'admin'
      ? await Admin.findById(decoded.userId).select('-password')
      : await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found for this token');
    }

    req.user = user;
    req.auth = { userId: user._id };
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export const protectWithOptionalAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    req.user = null;
    next();
    return;
  }

  const token = authorization.split(' ')[1];
  const demoUser = getDevelopmentDemoUser(token);

  if (demoUser) {
    req.user = demoUser;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');

    if (shouldUseLocalStore()) {
      const localUser = decoded.role === 'admin'
        ? await findAdminByIdLocal(decoded.userId)
        : await findUserByIdLocal(decoded.userId);

      if (localUser) {
        req.user = {
          _id: localUser._id,
          name: localUser.name,
          email: localUser.email,
          role: localUser.role,
          authIdentityKey: localUser.authIdentityKey,
          authProvider: localUser.authProvider,
          isDemoSession: true,
        };
        req.auth = { userId: localUser._id };
        next();
        return;
      }
    }

    const user = decoded.role === 'admin'
      ? await Admin.findById(decoded.userId).select('-password')
      : await User.findById(decoded.userId).select('-password');

    if (!user) {
      req.user = null;
      next();
      return;
    }

    req.user = user;
    req.auth = { userId: user._id };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (isDevelopmentMode || shouldUseLocalStore()) {
    req.user = req.user || demoAdminUser;
    next();
    return;
  }

  protect(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    authorize('admin')(req, res, next);
  });
};

export const requireSeller = (req, res, next) => {
  if (isDevelopmentMode || shouldUseLocalStore()) {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      protect(req, res, (error) => {
        if (error) {
          next(error);
          return;
        }

        authorize('admin', 'vendor')(req, res, next);
      });
      return;
    }

    req.user = req.user || demoAdminUser;
    next();
    return;
  }

  protect(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    authorize('admin', 'vendor')(req, res, next);
  });
};

export const getUserFromEmail = async (email) => {
  if (shouldUseLocalStore()) {
    return findUserByEmailLocal(email);
  }
  return User.findOne({ email: email.toLowerCase() });
};
