import { randomBytes } from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import {
  createLocalId,
  findUserByIdLocal,
  mutateLocalStore,
  paginateCollection,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import sanitizeUser from '../utils/sanitizeUser.js';
import { buildUserFilters, parsePagination } from '../utils/queryBuilder.js';

const buildClerkUserName = ({ name, firstName, lastName, email }) =>
  name?.trim() ||
  [firstName, lastName].filter(Boolean).join(' ').trim() ||
  email?.split('@')[0] ||
  'Customer';

const buildGeneratedPassword = () => randomBytes(24).toString('hex');

const normalizeUserRole = (user) => {
  if (!user) {
    return user;
  }

  if (user.role === 'user') {
    user.role = 'customer';
  }

  return user;
};

export const upsertUserFromClerk = async ({ clerkId, email, firstName, lastName, name, role = 'customer' }) => {
  if (!clerkId || !email) {
    throw new ApiError(400, 'Clerk user details are incomplete');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const resolvedName = buildClerkUserName({
    name,
    firstName,
    lastName,
    email: normalizedEmail,
  });

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let user =
        store.users.find((entry) => entry.clerkId === clerkId) ||
        store.users.find((entry) => entry.email === normalizedEmail);

      if (!user) {
        user = {
          _id: createLocalId(),
          clerkId,
          name: resolvedName,
          email: normalizedEmail,
          password: buildGeneratedPassword(),
          phone: '',
          alternatePhone: '',
          role,
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.users.push(user);
      } else {
        user.clerkId = clerkId;
        user.name = resolvedName;
        user.email = normalizedEmail;
        user.role = user.role || role;
        user.updatedAt = new Date().toISOString();
      }

      return sanitizeUser(user);
    });
  }

  let user = await User.findOne({
    $or: [{ clerkId }, { email: normalizedEmail }],
  });

  if (!user) {
    user = await User.create({
      clerkId,
      name: resolvedName,
      email: normalizedEmail,
      password: buildGeneratedPassword(),
      role,
      profileCompleted: false,
    });
    return { ...sanitizeUser(user), isNewUser: true };
  }

  user.clerkId = clerkId;
  user.name = resolvedName;
  user.email = normalizedEmail;
  user.role = user.role || role;
  await user.save();

  return { ...sanitizeUser(user), isNewUser: false };
};

export const getUserProfile = async (userId) => {
  if (shouldUseLocalStore()) {
    const user = await findUserByIdLocal(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.role === 'user') {
      return mutateLocalStore((store) => {
        const storedUser = store.users.find((entry) => entry._id === userId);

        if (!storedUser) {
          throw new ApiError(404, 'User not found');
        }

        storedUser.role = 'customer';
        storedUser.updatedAt = new Date().toISOString();

        return sanitizeUser(storedUser);
      });
    }

    return sanitizeUser(user);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'user') {
    user.role = 'customer';
    await user.save();
  }

  return sanitizeUser(user);
};

export const updateUserProfile = async (userId, payload) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const user = store.users.find((entry) => entry._id === userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (payload.email && payload.email !== user.email) {
        const emailTaken = store.users.find(
          (entry) => entry._id !== userId && entry.email === payload.email.toLowerCase().trim(),
        );

        if (emailTaken) {
          throw new ApiError(409, 'Email is already in use');
        }
      }

      if (payload.name !== undefined) {
        user.name = payload.name;
      }

      if (payload.email !== undefined) {
        user.email = payload.email.toLowerCase().trim();
      }

      if (payload.password) {
        user.password = payload.password;
      }

      if (payload.phone !== undefined) {
        user.phone = payload.phone;
      }

      if (payload.alternatePhone !== undefined) {
        user.alternatePhone = payload.alternatePhone;
      }

      if (payload.address !== undefined) {
        user.address = payload.address;
      }

      if (payload.city !== undefined) {
        user.city = payload.city;
      }

      if (payload.country !== undefined) {
        user.country = payload.country;
      }

      if (payload.landmark !== undefined) {
        user.landmark = payload.landmark;
      }

      if (payload.profileCompleted !== undefined) {
        user.profileCompleted = payload.profileCompleted;
      }

      if (payload.profileImage !== undefined) {
        user.profileImage = payload.profileImage;
      }

      if (user.role === 'user') {
        user.role = 'customer';
      }

      user.updatedAt = new Date().toISOString();
      return sanitizeUser(user);
    });
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (payload.email && payload.email !== user.email) {
    const emailTaken = await User.findOne({ email: payload.email });

    if (emailTaken) {
      throw new ApiError(409, 'Email is already in use');
    }
  }

  if (payload.name !== undefined) {
    user.name = payload.name;
  }

  if (payload.email !== undefined) {
    user.email = payload.email;
  }

  if (payload.password) {
    user.password = payload.password;
  }

  if (payload.phone !== undefined) {
    user.phone = payload.phone;
  }

  if (payload.alternatePhone !== undefined) {
    user.alternatePhone = payload.alternatePhone;
  }

  if (payload.address !== undefined) {
    user.address = payload.address;
  }

  if (payload.city !== undefined) {
    user.city = payload.city;
  }

  if (payload.country !== undefined) {
    user.country = payload.country;
  }

  if (payload.landmark !== undefined) {
    user.landmark = payload.landmark;
  }

  if (payload.profileCompleted !== undefined) {
    user.profileCompleted = payload.profileCompleted;
  }

  if (payload.profileImage !== undefined) {
    user.profileImage = payload.profileImage;
  }

  if (user.role === 'user') {
    user.role = 'customer';
  }

  await user.save();

  return sanitizeUser(user);
};

export const addUserAddress = async (userId, address) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const user = store.users.find((entry) => entry._id === userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      if (address.isDefault) {
        user.addresses = user.addresses.map((item) => ({
          ...item,
          isDefault: false,
        }));
      }

      if (!user.addresses.length) {
        address.isDefault = true;
      }

      user.addresses.push({
        _id: new Date().valueOf().toString(),
        ...address,
      });
      user.updatedAt = new Date().toISOString();
      return user.addresses;
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (address.isDefault) {
    user.addresses = user.addresses.map((item) => ({
      ...item.toObject(),
      isDefault: false,
    }));
  }

  if (!user.addresses.length) {
    address.isDefault = true;
  }

  user.addresses.push(address);
  await user.save();

  return user.addresses;
};

export const getAllUsers = async (query) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const search = query.search?.trim().toLowerCase();
    const filteredUsers = store.users.filter((user) => {
      if (query.role && user.role !== query.role) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    });

    const { page, limit } = parsePagination(query);
    const { items, pagination } = paginateCollection(filteredUsers, page, limit);

    return {
      users: items.map((user) => sanitizeUser(user)),
      pagination,
    };
  }

  const { page, limit, skip } = parsePagination(query);
  const filters = buildUserFilters(query);

  const [users, total] = await Promise.all([
    User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters),
  ]);

  return {
    users: users.map((user) => sanitizeUser(user)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const updateUserRole = async (userId, role) => {
  const nextRole = role === 'user' ? 'customer' : role;

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const user = store.users.find((entry) => entry._id === userId);

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      user.role = nextRole;
      user.updatedAt = new Date().toISOString();
      return sanitizeUser(user);
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.role = nextRole;
  await user.save();

  return sanitizeUser(user);
};

export const deleteUserById = async (userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const index = store.users.findIndex((entry) => entry._id === userId);

      if (index === -1) {
        throw new ApiError(404, 'User not found');
      }

      store.users.splice(index, 1);
      store.carts = store.carts.filter((cart) => cart.user !== userId);
      store.orders = store.orders.filter((order) => order.user !== userId);
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await user.deleteOne();
};
