import Admin from '../models/Admin.js';
import User from '../models/User.js';
import PasswordResetOtp from '../models/PasswordResetOtp.js';
import { randomBytes, randomInt } from 'crypto';
import {
  createLocalId,
  findAdminByEmailLocal,
  findUserByEmailLocal,
  mutateLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';
import generateToken from '../utils/generateToken.js';
import sanitizeUser from '../utils/sanitizeUser.js';
import { sendPasswordResetOtpEmail } from '../utils/email.js';

const PASSWORD_RESET_OTP_TTL_MINUTES = 10;
const PASSWORD_RESET_OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (value = '') => value.toLowerCase().trim();
const normalizePhone = (value = '') => {
  const digits = String(value || '').replace(/\D+/g, '').trim();

  if (!digits) {
    return '';
  }

  // India-friendly canonicalization (+91 / 91 / 0 prefixes)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
};
const ADMIN_EMAIL_CANONICAL = 'admin@example.com';
const ADMIN_EMAIL_ALIASES = new Set([ADMIN_EMAIL_CANONICAL, 'admin@exam0ple.com']);

const resolveLoginEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (ADMIN_EMAIL_ALIASES.has(normalized)) {
    return ADMIN_EMAIL_CANONICAL;
  }
  return normalized;
};

const isAdminDemoLogin = ({ rawEmail, password }) =>
  process.env.NODE_ENV !== 'production'
  && ADMIN_EMAIL_ALIASES.has(normalizeEmail(rawEmail))
  && password === 'admin123';

const normalizeCustomerRole = (user) => {
    if (user?.role === 'user') {
    user.role = 'customer';
  }

  return user;
};

const normalizeIdentityKey = (value = '') => String(value).trim();

const buildLoginIdentity = ({ provider = '', identityKey = '', email = '', phone = '', source = '', isPrimary = false }) => ({
  provider: provider || '',
  identityKey: normalizeIdentityKey(identityKey),
  email: normalizeEmail(email),
  phone: normalizePhone(phone),
  source,
  isPrimary,
  verifiedAt: new Date(),
});

const ensureLoginIdentity = (user, identity) => {
  if (!user || !identity) {
    return;
  }

  const loginIdentities = Array.isArray(user.loginIdentities) ? user.loginIdentities : [];
  const nextIdentity = {
    ...identity,
    email: normalizeEmail(identity.email || user.email || ''),
    phone: normalizePhone(identity.phone || user.phone || ''),
  };

  const existingIndex = loginIdentities.findIndex(
    (entry) =>
      (nextIdentity.identityKey && entry.identityKey === nextIdentity.identityKey) ||
      (nextIdentity.email && entry.email === nextIdentity.email) ||
      (nextIdentity.phone && entry.phone === nextIdentity.phone),
  );

  if (existingIndex >= 0) {
    loginIdentities[existingIndex] = {
      ...loginIdentities[existingIndex],
      ...nextIdentity,
      verifiedAt: new Date(),
    };
  } else {
    loginIdentities.push(nextIdentity);
  }

  if (!loginIdentities.some((entry) => entry.isPrimary)) {
    loginIdentities[0] = {
      ...loginIdentities[0],
      isPrimary: true,
    };
  }

  user.loginIdentities = loginIdentities;
  user.authIdentityKey = nextIdentity.identityKey || user.authIdentityKey || '';
  user.authProvider = nextIdentity.provider || user.authProvider || '';
  user.lastLoginAt = new Date();
};

const findMatchingIdentityLocal = (store, { clerkId, email, phone, identityKey }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const normalizedIdentityKey = normalizeIdentityKey(identityKey);

  return store.users.find((entry) => {
    const identityMatches = Array.isArray(entry.loginIdentities)
      && entry.loginIdentities.some((loginIdentity) => (
        (normalizedIdentityKey && loginIdentity.identityKey === normalizedIdentityKey)
        || (normalizedEmail && loginIdentity.email === normalizedEmail)
        || (normalizedPhone && normalizePhone(loginIdentity.phone) === normalizedPhone)
      ));

    return (
      (clerkId && entry.clerkId === clerkId)
      || (normalizedIdentityKey && entry.authIdentityKey === normalizedIdentityKey)
      || (normalizedEmail && entry.email?.toLowerCase() === normalizedEmail)
      || (normalizedPhone && normalizePhone(entry.phone) === normalizedPhone)
      || identityMatches
    );
  }) || null;
};

const findMatchingIdentityMongo = async ({ clerkId, email, phone, identityKey }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const normalizedIdentityKey = normalizeIdentityKey(identityKey);

  const query = {
    $or: [],
  };

  if (clerkId) query.$or.push({ clerkId });
  if (normalizedEmail) query.$or.push({ email: normalizedEmail });
  if (normalizedPhone) query.$or.push({ phone: normalizedPhone }, { alternatePhone: normalizedPhone });
  if (normalizedIdentityKey) query.$or.push({ authIdentityKey: normalizedIdentityKey });
  if (normalizedEmail || normalizedPhone || normalizedIdentityKey) {
    query.$or.push({
      loginIdentities: {
        $elemMatch: {
          $or: [
            normalizedEmail ? { email: normalizedEmail } : null,
            normalizedPhone ? { phone: normalizedPhone } : null,
            normalizedIdentityKey ? { identityKey: normalizedIdentityKey } : null,
          ].filter(Boolean),
        },
      },
    });
  }

  return User.findOne(query.$or.length ? query : { email: '__no_match__' });
};

const buildGeneratedPassword = () => randomBytes(24).toString('hex');

const buildSyntheticEmail = ({ email, phone, identityKey, name }) => {
  if (email) {
    return email;
  }

  const baseValue = phone || identityKey || name || 'customer';
  const normalizedBase = String(baseValue)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '') || 'customer';

  return `${normalizedBase}@clerk.local`;
};

const extractStringValue = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return extractStringValue(value[0]);
  }

  if (value && typeof value === 'object') {
    return (
      value.number ||
      value.phone ||
      value.e164 ||
      value.fullNumber ||
      value.email ||
      value.loginId ||
      value.value ||
      value.id ||
      value.identifier ||
      value.address ||
      ''
    );
  }

  return '';
};

const normalizeSyncPayload = (payload = {}) => ({
  name: payload.name?.trim() || '',
  email: normalizeEmail(buildSyntheticEmail({
    email: extractStringValue(payload.email),
    phone: extractStringValue(payload.phone),
    identityKey: extractStringValue(payload.identityKey || payload.userId || payload.id || payload.externalId),
    name: payload.name,
  })),
  phone: normalizePhone(extractStringValue(payload.phone)),
  alternatePhone: normalizePhone(extractStringValue(payload.alternatePhone)),
  profileImage: payload.profileImage?.trim() || '',
  identityKey: extractStringValue(payload.identityKey || payload.userId || payload.id || payload.externalId || payload.loginId),
  provider: extractStringValue(payload.provider),
});

export const registerUser = async ({ name, email, password, phone, role = 'customer', businessName = '', businessPhone = '', businessAddress = '' }) => {
  const userRole = role === 'vendor' ? 'vendor' : 'customer';
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (shouldUseLocalStore()) {
    const existingUser = await findMatchingIdentityLocal(await (await import('./localStoreService.js')).readLocalStore(), {
      email: normalizedEmail,
      phone: normalizedPhone,
      identityKey: normalizedEmail,
    });

    if (existingUser) {
      throw new ApiError(409, 'User already exists with this email');
    }

    const user = {
      _id: createLocalId(),
      name: name?.trim(),
        email: normalizedEmail,
      password,
        phone: phone?.trim() || '',
        authIdentityKey: normalizedEmail,
        authProvider: 'email-password',
        loginIdentities: [buildLoginIdentity({ provider: 'email-password', identityKey: normalizedEmail, email: normalizedEmail, phone: normalizedPhone, source: 'register', isPrimary: true })],
      role: userRole,
      addresses: [],
        lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await mutateLocalStore((store) => {
      store.users.push(user);
    });

    if (role === 'vendor') {
      const vendor = {
        _id: createLocalId(),
        user: user._id,
        businessName: businessName || name?.trim() || '',
        businessPhone: businessPhone?.trim() || phone?.trim() || '',
        businessAddress: businessAddress?.trim() || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
        await mutateLocalStore((store) => {
          store.vendors.push(vendor);
        });
    }

    return {
      user: sanitizeUser(normalizeCustomerRole(user)),
      token: generateToken(user),
      vendorCreated: role === 'vendor',
      message: role === 'vendor' 
        ? 'Vendor account created. Awaiting admin approval.' 
        : 'Registration successful',
    };
  }

  const existingUser = await findMatchingIdentityMongo({ email: normalizedEmail, phone: normalizedPhone, identityKey: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, 'User already exists with this email');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone: normalizedPhone,
    role: userRole,
    authIdentityKey: normalizedEmail,
    authProvider: 'email-password',
    loginIdentities: [buildLoginIdentity({ provider: 'email-password', identityKey: normalizedEmail, email: normalizedEmail, phone: normalizedPhone, source: 'register', isPrimary: true })],
    lastLoginAt: new Date(),
  });

  if (role === 'vendor') {
    const Vendor = (await import('../models/Vendor.js')).default;
    await Vendor.create({
      user: user._id,
      businessName: businessName || name?.trim() || '',
      businessPhone: businessPhone?.trim() || phone?.trim() || '',
      businessAddress: { line1: businessAddress?.trim() || '' },
      status: 'pending',
    });
  }

  return {
    user: sanitizeUser(user),
    token: generateToken(user),
    vendorCreated: role === 'vendor',
    message: role === 'vendor' 
      ? 'Vendor account created. Awaiting admin approval.' 
      : 'Registration successful',
  };
};

export const syncSessionUser = async (payload = {}) => {
  const { name, email, phone, alternatePhone, profileImage, identityKey, provider } = normalizeSyncPayload(payload);

  if (!email) {
    throw new ApiError(400, 'Valid email is required');
  }

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let user = findMatchingIdentityLocal(store, { email, phone, identityKey });

      if (!user) {
        user = {
          _id: createLocalId(),
          name: name || email.split('@')[0] || 'Customer',
          email,
          password: buildGeneratedPassword(),
          phone,
          alternatePhone,
          authIdentityKey: identityKey,
          authProvider: provider,
          loginIdentities: [buildLoginIdentity({ provider, identityKey, email, phone, source: 'sync', isPrimary: true })],
          role: 'customer',
          addresses: [],
          profileCompleted: false,
          profileImage,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.users.push(user);
      } else {
        user.name = name || user.name;
        user.email = email;
        user.phone = phone || user.phone || '';
        user.alternatePhone = alternatePhone || user.alternatePhone || '';
        user.profileImage = profileImage || user.profileImage || '';
        user.authIdentityKey = identityKey || user.authIdentityKey || '';
        user.authProvider = provider || user.authProvider || '';
        ensureLoginIdentity(user, { provider, identityKey, email, phone, source: 'sync', isPrimary: user.loginIdentities?.length ? false : true });
        user.role = user.role === 'user' ? 'customer' : user.role || 'customer';
        user.lastLoginAt = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
      }

      const sanitizedUser = sanitizeUser(normalizeCustomerRole(user))
      return {
        user: sanitizedUser,
        token: generateToken(sanitizedUser),
      }
    });
  }

  let user = await findMatchingIdentityMongo({ email, phone, identityKey });

  if (!user) {
    try {
      user = await User.create({
        name: name || email.split('@')[0] || 'Customer',
        email,
        password: buildGeneratedPassword(),
        phone,
        alternatePhone,
        profileImage,
        authIdentityKey: identityKey,
        authProvider: provider,
        loginIdentities: [buildLoginIdentity({ provider, identityKey, email, phone, source: 'sync', isPrimary: true })],
        role: 'customer',
        profileCompleted: false,
        lastLoginAt: new Date(),
      });
    } catch (error) {
      if (error?.code === 11000) {
        user = await User.findOne({
          $or: [
            { email },
            { phone },
            { alternatePhone: phone },
            { authIdentityKey: identityKey },
            { 'loginIdentities.email': email },
            { 'loginIdentities.phone': phone },
            { 'loginIdentities.identityKey': identityKey },
          ],
        }).select('+password');

        if (!user) {
          user = await findMatchingIdentityMongo({ email, phone, identityKey });
        }

        if (!user) {
          throw new ApiError(409, 'User already exists with this email');
        }
      } else {
        throw error;
      }
    }

    const sanitizedUser = sanitizeUser(normalizeCustomerRole(user))
    return {
      user: sanitizedUser,
      token: generateToken(sanitizedUser),
      isNewUser: true,
    }
  }

  if (name) {
    user.name = name;
  }

  user.email = email;
  user.phone = phone || normalizePhone(user.phone) || '';
  user.alternatePhone = alternatePhone || normalizePhone(user.alternatePhone) || '';
  user.profileImage = profileImage || user.profileImage || '';
  user.authIdentityKey = identityKey || user.authIdentityKey || '';
  user.authProvider = provider || user.authProvider || '';
  ensureLoginIdentity(user, { provider, identityKey, email, phone, source: 'sync', isPrimary: !user.loginIdentities?.length });
  user.lastLoginAt = new Date();

  if (user.role === 'user') {
    user.role = 'customer';
  }

  await user.save();

  const sanitizedUser = sanitizeUser(user)
  return {
    user: sanitizedUser,
    token: generateToken(sanitizedUser),
    isNewUser: false,
  }
};

export const loginUser = async ({ email, password }, options = {}) => {
  const { allowAdmin = false } = options;
  const lookupEmail = resolveLoginEmail(email);
  const isDevAdminAttempt = isAdminDemoLogin({ rawEmail: email, password });

  if (!allowAdmin && ADMIN_EMAIL_ALIASES.has(normalizeEmail(email))) {
    throw new ApiError(403, 'Use admin login for this account');
  }

  if (shouldUseLocalStore()) {
    let admin = await findAdminByEmailLocal(lookupEmail);
    let user = admin ? null : await findUserByEmailLocal(lookupEmail);

    if (!admin && isDevAdminAttempt) {
      admin = {
        _id: createLocalId(),
        name: 'Admin User',
        email: ADMIN_EMAIL_CANONICAL,
        password: 'admin123',
        phone: '',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await mutateLocalStore((store) => {
        store.admins.push(admin);
      });
    }

    const loginRecord = admin || user;
    const isPasswordValid = Boolean(
      loginRecord
      && (loginRecord.password === password
      || (isDevAdminAttempt
        && loginRecord.role === 'admin'
        && (loginRecord.password === 'Admin@123' || loginRecord.password === 'admin123'))),
    );

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (admin && admin.password !== 'admin123' && isDevAdminAttempt) {
      await mutateLocalStore((store) => {
        const storedAdmin = store.admins.find((entry) => entry._id === admin._id);
        if (storedAdmin) {
          storedAdmin.password = 'admin123';
          storedAdmin.updatedAt = new Date().toISOString();
        }
      });
      admin.password = 'admin123';
    }

    if (user?.role === 'user') {
      await mutateLocalStore((store) => {
        const customerUser = store.users.find((entry) => entry._id === user._id);
        if (customerUser) {
          customerUser.role = 'customer';
          customerUser.updatedAt = new Date().toISOString();
        }
      });
      user.role = 'customer';
    }

    return {
      user: sanitizeUser(normalizeCustomerRole(admin || user)),
      token: generateToken(admin || user),
    };
  }

  let admin = await Admin.findOne({ email: lookupEmail }).select('+password');
  let user = admin ? null : await User.findOne({ email: lookupEmail }).select('+password');

  if (!admin && isDevAdminAttempt) {
    admin = await Admin.create({
      name: 'Admin User',
      email: ADMIN_EMAIL_CANONICAL,
      password: 'admin123',
      role: 'admin',
      phone: '',
    });
    admin = await Admin.findOne({ email: ADMIN_EMAIL_CANONICAL }).select('+password');
  }

  const loginRecord = admin || user;
  const isPasswordValid = Boolean(loginRecord && (await loginRecord.matchPassword(password)));

  if (!isPasswordValid) {
    if (!(isDevAdminAttempt && admin?.role === 'admin')) {
      throw new ApiError(401, 'Invalid email or password');
    }

    admin.password = 'admin123';
    await admin.save();
  }

  if (user?.role === 'user') {
    user.role = 'customer';
    await user.save();
  }

  return {
    user: sanitizeUser(normalizeCustomerRole(admin || user)),
    token: generateToken(admin || user),
  };
};

const enforceExpectedLoginRole = (user, expectedRole) => {
  if (!expectedRole) {
    return;
  }

  if (user?.role !== expectedRole) {
    const roleLabel = expectedRole === 'admin' ? 'Admin' : 'Vendor';
    throw new ApiError(403, `${roleLabel} account not found for these credentials`);
  }
};

export const loginAdminUser = async (credentials) => {
  const normalizedEmail = resolveLoginEmail(credentials?.email || '');

  if (normalizedEmail !== ADMIN_EMAIL_CANONICAL || credentials?.password !== 'admin123') {
    throw new ApiError(401, 'Use fixed admin credentials only');
  }

  try {
    const result = await loginUser(credentials, { allowAdmin: true });
    enforceExpectedLoginRole(result.user, 'admin');
    return result;
  } catch (error) {
    // If login fails due to invalid credentials or user not found, 
    // and we have the correct hardcoded credentials, create the admin account
    if (process.env.NODE_ENV !== 'production' && error.statusCode === 401) {
      const admin = await Admin.findOne({ email: ADMIN_EMAIL_CANONICAL });
      
      if (!admin) {
        // Create admin if it doesn't exist
        const newAdmin = await Admin.create({
          name: 'Admin User',
          email: ADMIN_EMAIL_CANONICAL,
          password: 'admin123',
          role: 'admin',
          phone: '',
        });
        
        return {
          user: sanitizeUser(newAdmin),
          token: generateToken(newAdmin),
        };
      }
    }
    throw error;
  }
};

export const loginVendorUser = async (credentials) => {
  const lookupEmail = resolveLoginEmail(credentials?.email);

  if (shouldUseLocalStore()) {
    const localVendor = await findUserByEmailLocal(lookupEmail);

    if (!localVendor) {
      throw new ApiError(404, 'Vendor account not found. Please register as a vendor first.');
    }

    if (localVendor.role !== 'vendor') {
      throw new ApiError(403, 'Vendor account not found for these credentials');
    }
  } else {
    const vendorAccount = await User.findOne({ email: lookupEmail }).select('role');

    if (!vendorAccount) {
      throw new ApiError(404, 'Vendor account not found. Please register as a vendor first.');
    }

    if (vendorAccount.role !== 'vendor') {
      throw new ApiError(403, 'Vendor account not found for these credentials');
    }
  }

  const result = await loginUser(credentials);
  enforceExpectedLoginRole(result.user, 'vendor');
  return result;
};

const findUserByIdentifierLocal = (store, identifier) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);
  const normalizedPhone = normalizePhone(normalizedIdentifier);

  return (store.users || []).find((entry) => {
    const entryEmail = normalizeEmail(entry.email || '');
    const entryPhone = normalizePhone(entry.phone || '');
    const entryAltPhone = normalizePhone(entry.alternatePhone || '');

    return (
      (normalizedEmail && entryEmail === normalizedEmail)
      || (normalizedPhone && (entryPhone === normalizedPhone || entryAltPhone === normalizedPhone))
    );
  }) || null;
};

const findUserByIdentifierMongo = async (identifier) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);
  const normalizedPhone = normalizePhone(normalizedIdentifier);

  const query = normalizedEmail.includes('@')
    ? { email: normalizedEmail }
    : {
        $or: [
          { phone: normalizedPhone },
          { alternatePhone: normalizedPhone },
        ],
      };

  return User.findOne(query).select('+password');
};

const generatePasswordResetOtp = () => String(randomInt(100000, 1000000));

const ensureOtpValue = (otp = '') => {
  const sanitizedOtp = String(otp || '').trim();
  if (!/^\d{6}$/.test(sanitizedOtp)) {
    throw new ApiError(400, 'Please enter a valid 6-digit OTP');
  }
  return sanitizedOtp;
};

const isEmailIdentifier = (identifier = '') => normalizeEmail(identifier).includes('@');

const findLatestResetDocByIdentifier = async ({ identifier, userId = null }) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);

  if (userId) {
    const byUser = await PasswordResetOtp.findOne({
      user: userId,
      usedAt: null,
    }).sort({ createdAt: -1 });

    if (byUser) {
      return byUser;
    }
  }

  if (normalizedEmail.includes('@')) {
    return PasswordResetOtp.findOne({
      email: normalizedEmail,
      usedAt: null,
    }).sort({ createdAt: -1 });
  }

  return null;
};

export const requestPasswordResetOtp = async ({ identifier }) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);

  if (!normalizedIdentifier) {
    throw new ApiError(400, 'Email or phone is required');
  }

  if (shouldUseLocalStore()) {
    const localResult = await mutateLocalStore((store) => {
      const user = findUserByIdentifierLocal(store, normalizedIdentifier);

      const otp = generatePasswordResetOtp();

      if (!user) {
        if (!isEmailIdentifier(normalizedIdentifier)) {
          return null;
        }

        return {
          email: normalizedEmail,
          name: 'User',
          otp,
        };
      }

      const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);

      user.passwordResetOtp = {
        otp,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        verifiedAt: null,
        usedAt: null,
      };
      user.updatedAt = new Date().toISOString();

      return {
        email: user.email,
        name: user.name,
        otp,
      };
    });

    if (!localResult) {
      if (isEmailIdentifier(normalizedIdentifier)) {
        const guestOtp = generatePasswordResetOtp();

        try {
          await sendPasswordResetOtpEmail({
            email: normalizedEmail,
            otp: guestOtp,
            name: 'User',
          });
        } catch (error) {
          throw new ApiError(502, 'Failed to send OTP email. Please try again.');
        }

        return { message: 'If an account exists, OTP has been sent' };
      }

      return { message: 'If an account exists, OTP has been sent' };
    }

    try {
      await sendPasswordResetOtpEmail({
        email: localResult.email,
        otp: localResult.otp,
        name: localResult.name,
      });
    } catch (error) {
      throw new ApiError(502, 'Failed to send OTP email. Please try again.');
    }

    return { message: 'If an account exists, OTP has been sent' };
  }

  const user = await findUserByIdentifierMongo(normalizedIdentifier);

  const otp = generatePasswordResetOtp();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);

  if (user) {
    await PasswordResetOtp.deleteMany({
      user: user._id,
      usedAt: null,
    });

    await PasswordResetOtp.create({
      user: user._id,
      email: user.email,
      otp,
      expiresAt,
    });
  } else if (isEmailIdentifier(normalizedIdentifier)) {
    await PasswordResetOtp.deleteMany({
      email: normalizedEmail,
      usedAt: null,
    });

    await PasswordResetOtp.create({
      email: normalizedEmail,
      otp,
      expiresAt,
    });
  } else {
    return { message: 'If an account exists, OTP has been sent' };
  }

  try {
    await sendPasswordResetOtpEmail({
      email: user?.email || normalizedEmail,
      otp,
      name: user?.name || 'User',
    });
  } catch (error) {
    throw new ApiError(502, 'Failed to send OTP email. Please try again.');
  }

  return { message: 'If an account exists, OTP has been sent' };
};

export const verifyPasswordResetOtp = async ({ identifier, otp }) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);
  const sanitizedOtp = ensureOtpValue(otp);

  if (!normalizedIdentifier) {
    throw new ApiError(400, 'Email or phone is required');
  }

  if (shouldUseLocalStore()) {
    await mutateLocalStore((store) => {
      const user = findUserByIdentifierLocal(store, normalizedIdentifier);

      const resetState = user?.passwordResetOtp || null;

      if (!resetState && !isEmailIdentifier(normalizedIdentifier)) {
        throw new ApiError(400, 'OTP not requested or already expired');
      }

      if (!resetState && isEmailIdentifier(normalizedIdentifier)) {
        const guestRecord = store.passwordResetOtps?.find((entry) => normalizeEmail(entry.email || '') === normalizedEmail && !entry.usedAt);
        if (!guestRecord) {
          throw new ApiError(400, 'OTP not requested or already expired');
        }

        if (guestRecord.expiresAt && new Date(guestRecord.expiresAt).getTime() < Date.now()) {
          throw new ApiError(400, 'OTP expired. Please request a new OTP');
        }

        if (String(guestRecord.otp) !== sanitizedOtp) {
          guestRecord.attempts = Number(guestRecord.attempts || 0) + 1;
          if (guestRecord.attempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
            guestRecord.usedAt = new Date().toISOString();
          }
          throw new ApiError(400, 'Invalid OTP');
        }

        guestRecord.verifiedAt = new Date().toISOString();
        guestRecord.attempts = 0;
        return;
      }

      if (resetState.usedAt) {
        throw new ApiError(400, 'OTP already used. Please request a new OTP');
      }

      if (!resetState.expiresAt || new Date(resetState.expiresAt).getTime() < Date.now()) {
        throw new ApiError(400, 'OTP expired. Please request a new OTP');
      }

      if (String(resetState.otp) !== sanitizedOtp) {
        resetState.attempts = Number(resetState.attempts || 0) + 1;
        if (resetState.attempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
          resetState.usedAt = new Date().toISOString();
        }
        user.updatedAt = new Date().toISOString();
        throw new ApiError(400, 'Invalid OTP');
      }

      resetState.verifiedAt = new Date().toISOString();
      resetState.attempts = 0;
      user.updatedAt = new Date().toISOString();
    });

    return { message: 'OTP verified successfully' };
  }

  const user = await findUserByIdentifierMongo(normalizedIdentifier);

  const resetDoc = await findLatestResetDocByIdentifier({
    identifier: normalizedIdentifier,
    userId: user?._id || null,
  });

  if (!resetDoc) {
    throw new ApiError(400, 'OTP not requested or already expired');
  }

  if (resetDoc.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP expired. Please request a new OTP');
  }

  if (resetDoc.otp !== sanitizedOtp) {
    resetDoc.attempts += 1;
    if (resetDoc.attempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
      resetDoc.usedAt = new Date();
    }
    await resetDoc.save();
    throw new ApiError(400, 'Invalid OTP');
  }

  resetDoc.verifiedAt = new Date();
  resetDoc.attempts = 0;
  await resetDoc.save();

  return { message: 'OTP verified successfully' };
};

export const resetPasswordWithOtp = async ({ identifier, otp, newPassword }) => {
  const normalizedIdentifier = String(identifier || '').trim();
  const normalizedEmail = normalizeEmail(normalizedIdentifier);
  const sanitizedOtp = ensureOtpValue(otp);

  if (!normalizedIdentifier) {
    throw new ApiError(400, 'Email or phone is required');
  }

  if (!newPassword || String(newPassword).length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const user = findUserByIdentifierLocal(store, normalizedIdentifier);

      const resetState = user?.passwordResetOtp || null;

      if (!resetState && !isEmailIdentifier(normalizedIdentifier)) {
        throw new ApiError(400, 'OTP not requested or already expired');
      }

      if (!resetState && isEmailIdentifier(normalizedIdentifier)) {
        const guestRecord = store.passwordResetOtps?.find((entry) => normalizeEmail(entry.email || '') === normalizedEmail && !entry.usedAt);
        if (!guestRecord) {
          throw new ApiError(400, 'OTP not requested or already expired');
        }

        if (guestRecord.expiresAt && new Date(guestRecord.expiresAt).getTime() < Date.now()) {
          throw new ApiError(400, 'OTP expired. Please request a new OTP');
        }

        if (String(guestRecord.otp) !== sanitizedOtp) {
          throw new ApiError(400, 'Invalid OTP');
        }

        guestRecord.verifiedAt = guestRecord.verifiedAt || new Date().toISOString();
        guestRecord.usedAt = new Date().toISOString();

        if (!user) {
          return {
            _id: createLocalId(),
            email: normalizedEmail,
            phone: '',
          };
        }
      }

      if (resetState.usedAt) {
        throw new ApiError(400, 'OTP already used. Please request a new OTP');
      }

      if (!resetState.expiresAt || new Date(resetState.expiresAt).getTime() < Date.now()) {
        throw new ApiError(400, 'OTP expired. Please request a new OTP');
      }

      if (String(resetState.otp) !== sanitizedOtp) {
        throw new ApiError(400, 'Invalid OTP');
      }

      if (!resetState.verifiedAt) {
        resetState.verifiedAt = new Date().toISOString();
      }

      user.password = String(newPassword);
      resetState.usedAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();

      return {
        _id: user._id,
        email: user.email,
        phone: user.phone,
      };
    });
  }

  let user = await findUserByIdentifierMongo(normalizedIdentifier);

  const resetDoc = await findLatestResetDocByIdentifier({
    identifier: normalizedIdentifier,
    userId: user?._id || null,
  });

  if (!resetDoc) {
    throw new ApiError(400, 'OTP not requested or already expired');
  }

  if (resetDoc.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP expired. Please request a new OTP');
  }

  if (resetDoc.otp !== sanitizedOtp) {
    resetDoc.attempts += 1;
    if (resetDoc.attempts >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
      resetDoc.usedAt = new Date();
    }
    await resetDoc.save();
    throw new ApiError(400, 'Invalid OTP');
  }

  if (!user && isEmailIdentifier(normalizedIdentifier)) {
    user = await User.create({
      name: normalizedEmail.split('@')[0] || 'Customer',
      email: normalizedEmail,
      password: String(newPassword),
      role: 'customer',
      phone: '',
      authIdentityKey: normalizedEmail,
      authProvider: 'email-password',
      loginIdentities: [buildLoginIdentity({ provider: 'email-password', identityKey: normalizedEmail, email: normalizedEmail, source: 'password-reset', isPrimary: true })],
      profileCompleted: false,
      lastLoginAt: new Date(),
    });
  } else {
    user.password = String(newPassword);
    await user.save();
  }

  resetDoc.verifiedAt = resetDoc.verifiedAt || new Date();
  resetDoc.usedAt = new Date();

  await resetDoc.save();

  return {
    _id: user._id,
    email: user.email,
    phone: user.phone,
  };
};
