import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import {
  findCartByUserIdLocal,
  hydrateLocalCart,
  mutateLocalStore,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';

const calculateTotals = (cart) => {
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const getItemKey = (productId, size, color = '') => `${productId}:${size}:${String(color || '').trim().toLowerCase()}`;

const DEFAULT_SIZE = 'ONE_SIZE';

const normalizeSizeToken = (value = '') =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[-_\s]+/g, '');

const isOneSizeToken = (value = '') => {
  const normalized = normalizeSizeToken(value);
  return normalized === 'ONESIZE' || normalized === 'FREESIZE';
};

const resolveCartSize = (product, size) => {
  const availableSizes = Array.isArray(product?.sizes)
    ? product.sizes
        .map((entry) => entry?.toString().trim())
        .filter(Boolean)
    : [];

  if (!availableSizes.length) {
    return DEFAULT_SIZE;
  }

  const normalizedSize = size?.toString().trim();

  if (!normalizedSize) {
    const oneSizeMatch = availableSizes.find((entry) => isOneSizeToken(entry));
    if (oneSizeMatch) {
      return oneSizeMatch;
    }
    throw new ApiError(400, 'Please select a size');
  }

  const matchedSize = availableSizes.find(
    (entry) => normalizeSizeToken(entry) === normalizeSizeToken(normalizedSize),
  );

  if (!matchedSize) {
    if (isOneSizeToken(normalizedSize)) {
      const oneSizeMatch = availableSizes.find((entry) => isOneSizeToken(entry));
      if (oneSizeMatch) {
        return oneSizeMatch;
      }
    }
    throw new ApiError(400, 'Selected size is not available for this product');
  }

  return matchedSize;
};

const resolveCartColor = (product, color) => {
  const availableColors = Array.isArray(product?.colors)
    ? product.colors
        .map((entry) => entry?.toString().trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!availableColors.length) {
    return '';
  }

  const normalizedColor = color?.toString().trim().toLowerCase();

  if (!normalizedColor) {
    throw new ApiError(400, 'Please select a color');
  }

  if (!availableColors.includes(normalizedColor)) {
    throw new ApiError(400, 'Selected color is not available for this product');
  }

  return normalizedColor;
};

const getColorVariantImages = (product, color) => {
  if (!color) {
    return [];
  }

  if (product?.colorImages?.get && typeof product.colorImages.get === 'function') {
    const mapEntry = product.colorImages.get(color);
    return Array.isArray(mapEntry) ? mapEntry : [];
  }

  if (product?.colorImages && typeof product.colorImages === 'object') {
    const mapEntry = product.colorImages[color];
    return Array.isArray(mapEntry) ? mapEntry : [];
  }

  return [];
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
};

const hydrateCart = async (userId) =>
  Cart.findOne({ user: userId }).populate(
    'items.product',
    'name slug price salePrice stock images category collection sizes colors',
  );

const buildCartItem = (product, quantity, size, color = '') => ({
  product: product._id,
  slug: product.slug,
  name: product.name,
  image: getColorVariantImages(product, color)[0]?.url || product.images[0]?.url || '',
  size,
  color,
  price: product.salePrice ?? product.price,
  quantity,
  stock: product.stock,
});

export const getUserCart = async (userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        cart = {
          _id: userId,
          user: userId,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.carts.push(cart);
      }

      return hydrateLocalCart(cart, store);
    });
  }

  await getOrCreateCart(userId);
  return hydrateCart(userId);
};

export const addItemToCart = async (userId, { productId, quantity, size, color }) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const product = store.products.find((entry) => entry._id === productId);

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      const resolvedSize = resolveCartSize(product, size);
      const resolvedColor = resolveCartColor(product, color);

      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        cart = {
          _id: userId,
          user: userId,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.carts.push(cart);
      }

      const itemKey = getItemKey(productId, resolvedSize, resolvedColor);
      const existingItem = cart.items.find(
        (item) => getItemKey(item.product.toString(), item.size, item.color) === itemKey,
      );
      const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      if (nextQuantity > product.stock) {
        throw new ApiError(400, 'Requested quantity exceeds available stock');
      }

      const itemPayload = buildCartItem(product, nextQuantity, resolvedSize, resolvedColor);

      if (existingItem) {
        Object.assign(existingItem, itemPayload);
      } else {
        cart.items.push(itemPayload);
      }

      calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();
      return hydrateLocalCart(cart, store);
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const resolvedSize = resolveCartSize(product, size);
  const resolvedColor = resolveCartColor(product, color);

  const cart = await getOrCreateCart(userId);
  const itemKey = getItemKey(productId, resolvedSize, resolvedColor);
  const existingItem = cart.items.find(
    (item) => getItemKey(item.product.toString(), item.size, item.color) === itemKey,
  );
  const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (nextQuantity > product.stock) {
    throw new ApiError(400, 'Requested quantity exceeds available stock');
  }

  const itemPayload = buildCartItem(product, nextQuantity, resolvedSize, resolvedColor);

  if (existingItem) {
    Object.assign(existingItem, itemPayload);
  } else {
    cart.items.push(itemPayload);
  }

  calculateTotals(cart);
  await cart.save();

  return hydrateCart(userId);
};

export const updateCartItemQuantity = async (userId, productId, quantity, size, color) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const product = store.products.find((entry) => entry._id === productId);

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      const resolvedSize = resolveCartSize(product, size);
      const resolvedColor = resolveCartColor(product, color);

      if (quantity > product.stock) {
        throw new ApiError(400, 'Requested quantity exceeds available stock');
      }

      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        throw new ApiError(404, 'Cart item not found');
      }

      const item = cart.items.find(
        (entry) =>
          getItemKey(entry.product.toString(), entry.size, entry.color)
          === getItemKey(productId, resolvedSize, resolvedColor),
      );

      if (!item) {
        throw new ApiError(404, 'Cart item not found');
      }

      Object.assign(item, buildCartItem(product, quantity, resolvedSize, resolvedColor));
      calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();
      return hydrateLocalCart(cart, store);
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const resolvedSize = resolveCartSize(product, size);
  const resolvedColor = resolveCartColor(product, color);

  if (quantity > product.stock) {
    throw new ApiError(400, 'Requested quantity exceeds available stock');
  }

  const cart = await getOrCreateCart(userId);
  const item = cart.items.find(
    (entry) =>
      getItemKey(entry.product.toString(), entry.size, entry.color)
      === getItemKey(productId, resolvedSize, resolvedColor),
  );

  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }

  Object.assign(item, buildCartItem(product, quantity, resolvedSize, resolvedColor));

  calculateTotals(cart);
  await cart.save();

  return hydrateCart(userId);
};

export const removeItemFromCart = async (userId, productId, size, color = '') => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        throw new ApiError(404, 'Cart item not found');
      }

      const initialLength = cart.items.length;
      const normalizedColor = String(color || '').trim().toLowerCase();
      cart.items = cart.items.filter(
        (item) => getItemKey(item.product.toString(), item.size, item.color) !== getItemKey(productId, size, normalizedColor),
      );

      if (cart.items.length === initialLength) {
        throw new ApiError(404, 'Cart item not found');
      }

      calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();
      return hydrateLocalCart(cart, store);
    });
  }

  const cart = await getOrCreateCart(userId);
  const initialLength = cart.items.length;
  const normalizedColor = String(color || '').trim().toLowerCase();

  cart.items = cart.items.filter(
    (item) => getItemKey(item.product.toString(), item.size, item.color) !== getItemKey(productId, size, normalizedColor),
  );

  if (cart.items.length === initialLength) {
    throw new ApiError(404, 'Cart item not found');
  }

  calculateTotals(cart);
  await cart.save();

  return hydrateCart(userId);
};

export const syncCartItems = async (userId, items = []) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        cart = {
          _id: userId,
          user: userId,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.carts.push(cart);
      }

      const syncedItems = [];

      for (const item of items) {
        const product = store.products.find((entry) => entry._id === item.productId);

        if (!product) {
          continue;
        }

        let resolvedSize;
        let resolvedColor;
        try {
          resolvedSize = resolveCartSize(product, item.size);
          resolvedColor = resolveCartColor(product, item.color);
        } catch {
          continue;
        }

        if (item.quantity < 1 || item.quantity > product.stock) {
          continue;
        }

        syncedItems.push(buildCartItem(product, item.quantity, resolvedSize, resolvedColor));
      }

      cart.items = syncedItems;
      calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();
      return hydrateLocalCart(cart, store);
    });
  }

  const cart = await getOrCreateCart(userId);
  const syncedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      continue;
    }

    let resolvedSize;
    let resolvedColor;
    try {
      resolvedSize = resolveCartSize(product, item.size);
      resolvedColor = resolveCartColor(product, item.color);
    } catch {
      continue;
    }

    if (item.quantity < 1 || item.quantity > product.stock) {
      continue;
    }

    syncedItems.push(buildCartItem(product, item.quantity, resolvedSize, resolvedColor));
  }

  cart.items = syncedItems;
  calculateTotals(cart);
  await cart.save();

  return hydrateCart(userId);
};

export const clearUserCart = async (userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      let cart = store.carts.find((entry) => entry.user === userId);

      if (!cart) {
        cart = {
          _id: userId,
          user: userId,
          items: [],
          totalItems: 0,
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.carts.push(cart);
      }

      cart.items = [];
      calculateTotals(cart);
      cart.updatedAt = new Date().toISOString();
      return cart;
    });
  }

  const cart = await getOrCreateCart(userId);

  cart.items = [];
  calculateTotals(cart);
  await cart.save();

  return cart;
};
