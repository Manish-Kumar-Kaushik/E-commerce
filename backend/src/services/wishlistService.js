import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import ApiError from '../utils/ApiError.js';

const WISHLIST_POPULATE_FIELDS = 'name slug description price salePrice stock category collection images';

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  return wishlist;
};

const populateWishlist = async (wishlist) =>
  wishlist.populate({
    path: 'items.product',
    select: WISHLIST_POPULATE_FIELDS,
  });

export const getWishlistForUser = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  const populated = await populateWishlist(wishlist);
  return populated.toJSON();
};

export const toggleWishlistItem = async (userId, productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const wishlist = await getOrCreateWishlist(userId);
  const existingIndex = wishlist.items.findIndex((item) => item.product.toString() === productId.toString());

  if (existingIndex >= 0) {
    wishlist.items.splice(existingIndex, 1);
  } else {
    wishlist.items.unshift({
      product: product._id,
      addedAt: new Date(),
    });
  }

  await wishlist.save();
  const populated = await populateWishlist(wishlist);
  return populated.toJSON();
};

export const removeWishlistItem = async (userId, productId) => {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId.toString());
  await wishlist.save();
  const populated = await populateWishlist(wishlist);
  return populated.toJSON();
};

export const clearWishlist = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.items = [];
  await wishlist.save();
  const populated = await populateWishlist(wishlist);
  return populated.toJSON();
};
