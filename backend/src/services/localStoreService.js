import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getDatabaseStatus } from '../config/db.js';

export const LOCAL_ADMIN_USER_ID = '000000000000000000000001';
export const LOCAL_DEMO_USER_ID = '000000000000000000000002';
export const LOCAL_VENDOR_USER_ID = '000000000000000000000003';

const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(serviceDirectory, '..', '..');
const dataDirectory = path.join(backendRoot, 'data');
const storePath = path.join(dataDirectory, 'local-store.json');

let writeQueue = Promise.resolve();

const createDefaultStore = () => ({
  admins: [
    {
      _id: LOCAL_ADMIN_USER_ID,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  users: [
    {
      _id: LOCAL_DEMO_USER_ID,
      name: 'Demo User',
      email: 'user@example.com',
      password: 'user123',
      phone: '',
      alternatePhone: '',
      authIdentityKey: '',
      authProvider: '',
      loginIdentities: [],
      lastLoginAt: null,
      role: 'customer',
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  products: [],
  vendors: [],
  notifications: [],
  collections: [],
  carts: [],
  orders: [],
  reviews: [],
  coupons: [],
  vendorPhoneOtps: [],
});

const ensureStoreFile = async () => {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(storePath, 'utf8');
  } catch {
    await writeFile(storePath, JSON.stringify(createDefaultStore(), null, 2));
  }
};

export const readLocalStore = async () => {
  await ensureStoreFile();

  const raw = await readFile(storePath, 'utf8');
  const parsed = JSON.parse(raw || '{}');

  return {
    ...createDefaultStore(),
    ...parsed,
    admins: Array.isArray(parsed.admins) && parsed.admins.length ? parsed.admins : createDefaultStore().admins,
    users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : createDefaultStore().users,
    products: Array.isArray(parsed.products) ? parsed.products : [],
    vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    collections: Array.isArray(parsed.collections) ? parsed.collections : [],
    carts: Array.isArray(parsed.carts) ? parsed.carts : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
    vendorPhoneOtps: Array.isArray(parsed.vendorPhoneOtps) ? parsed.vendorPhoneOtps : [],
  };
};

export const mutateLocalStore = async (mutator) => {
  const runMutation = async () => {
    const store = await readLocalStore();
    const result = await mutator(store);
    await writeFile(storePath, JSON.stringify(store, null, 2));
    return result;
  };

  writeQueue = writeQueue.then(runMutation, runMutation);
  return writeQueue;
};

export const createLocalId = () => randomBytes(12).toString('hex');

export const shouldUseLocalStore = () => process.env.FORCE_LOCAL_STORE === 'true';

export const paginateCollection = (items, page, limit) => {
  const total = items.length;
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export const findUserByIdLocal = async (userId) => {
  const store = await readLocalStore();
  return store.users.find((user) => user._id === userId) || null;
};

export const findAdminByIdLocal = async (adminId) => {
  const store = await readLocalStore();
  return store.admins.find((admin) => admin._id === adminId) || null;
};

export const findUserByEmailLocal = async (email) => {
  const store = await readLocalStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findAdminByEmailLocal = async (email) => {
  const store = await readLocalStore();
  return store.admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase()) || null;
};

export const upsertCartLocal = async (userId, updater) =>
  mutateLocalStore((store) => {
    let cart = store.carts.find((entry) => entry.user === userId);

    if (!cart) {
      cart = {
        _id: createLocalId(),
        user: userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.carts.push(cart);
    }

    const result = updater(cart, store);
    cart.updatedAt = new Date().toISOString();
    return result ?? cart;
  });

export const findCartByUserIdLocal = async (userId) => {
  const store = await readLocalStore();
  return store.carts.find((entry) => entry.user === userId) || null;
};

export const findOrderByIdLocal = async (orderId) => {
  const store = await readLocalStore();
  return store.orders.find((order) => order._id === orderId) || null;
};

export const findOrderByPaymentIntentLocal = async (paymentIntentId) => {
  const store = await readLocalStore();
  return store.orders.find(
    (order) => order.paymentDetails?.stripePaymentIntentId === paymentIntentId,
  ) || null;
};

export const hydrateLocalOrder = (order, store) => {
  if (!order) {
    return null;
  }

  const user = store.users.find((entry) => entry._id === order.user) || null;

  return {
    ...order,
    user: user
      ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      : null,
    items: (order.items || []).map((item) => {
      const product = store.products.find((entry) => entry._id === item.product) || null;

      return {
        ...item,
        product: product
          ? {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              category: product.category,
              images: product.images,
              stock: product.stock,
            }
          : null,
      };
    }),
  };
};

export const hydrateLocalCart = (cart, store) => {
  if (!cart) {
    return null;
  }

  return {
    ...cart,
    items: (cart.items || []).map((item) => {
      const product = store.products.find((entry) => entry._id === item.product) || null;

      return {
        ...item,
        product: product
          ? {
              _id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              salePrice: product.salePrice,
              stock: product.stock,
              images: product.images,
              category: product.category,
              collection: product.collection,
              sizes: product.sizes,
              colors: product.colors,
            }
          : null,
      };
    }),
  };
};
