import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import ApiError from '../utils/ApiError.js';
import { createLocalId, mutateLocalStore, readLocalStore, shouldUseLocalStore } from './localStoreService.js';

const buildProductSummary = (reviews = []) => {
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews
    : 0;

  return {
    averageRating: Number(averageRating.toFixed(2)),
    totalReviews,
  };
};

const applySummaryToLocalProduct = (store, productId, summary) => {
  const targetProduct = (store.products || []).find((entry) => entry._id?.toString() === productId?.toString());
  if (!targetProduct) {
    return;
  }

  targetProduct.averageRating = Number(summary.averageRating || 0);
  targetProduct.reviewsCount = Number(summary.totalReviews || 0);
  targetProduct.reviewSummary = {
    averageRating: targetProduct.averageRating,
    totalReviews: targetProduct.reviewsCount,
  };
};

const syncProductReviewSummary = async (productId, localStore = null) => {
  if (!productId) {
    return buildProductSummary([]);
  }

  if (shouldUseLocalStore()) {
    const store = localStore || await readLocalStore();
    const publishedReviews = (store.reviews || []).filter(
      (review) => review.product?.toString() === productId.toString() && review.status === 'published',
    );
    const summary = buildProductSummary(publishedReviews);
    applySummaryToLocalProduct(store, productId, summary);
    return summary;
  }

  const aggregate = await Review.aggregate([
    {
      $match: {
        product: productId,
        status: 'published',
      },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const summary = aggregate[0]
    ? {
        averageRating: Number(Number(aggregate[0].averageRating || 0).toFixed(2)),
        totalReviews: Number(aggregate[0].totalReviews || 0),
      }
    : {
        averageRating: 0,
        totalReviews: 0,
      };

  await Product.findByIdAndUpdate(productId, {
    averageRating: summary.averageRating,
    reviewsCount: summary.totalReviews,
  });

  return summary;
};

const resolveProductRecord = async (identifier) => {
  if (!identifier) {
    return null;
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    return (store.products || []).find(
      (entry) => entry._id === identifier || entry.slug === String(identifier).toLowerCase(),
    ) || null;
  }

  if (identifier.toString().match(/^[0-9a-fA-F]{24}$/)) {
    return Product.findById(identifier).lean();
  }

  return Product.findOne({ slug: String(identifier).toLowerCase() }).lean();
};

const resolveProductId = async (identifier) => {
  const product = await resolveProductRecord(identifier);
  return product?._id || null;
};

const normalizeReviewImages = (images = []) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      if (!image) return null;
      if (typeof image === 'string') {
        return { url: image.trim(), publicId: '' };
      }

      const url = image.url?.toString?.().trim?.() || '';
      if (!url) return null;
      return {
        url,
        publicId: image.publicId?.toString?.().trim?.() || '',
      };
    })
    .filter((image) => image?.url)
    .slice(0, 5);
};

const verifyPurchase = async (userId, productId, itemId = null) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const orders = (store.orders || []).filter((order) => order.user === userId && order.paymentStatus === 'paid');

    return orders.some((order) =>
      (order.items || []).some((item) => {
        const matchesProduct = item.product === productId;
        const matchesItem = itemId ? item._id === itemId : true;
        return matchesProduct && matchesItem && ['delivered', 'returned', 'refunded'].includes(item.itemStatus || order.orderStatus);
      }),
    );
  }

  const query = {
    user: userId,
    paymentStatus: 'paid',
    'items.product': productId,
  };

  if (itemId) {
    query['items._id'] = itemId;
  }

  const orders = await Order.find(query).lean();
  if (!orders.length) {
    return false;
  }

  return orders.some((order) => {
    const orderDelivered = ['delivered', 'returned', 'refunded'].includes(String(order.orderStatus || '').toLowerCase());
    return (order.items || []).some((item) => {
      const matchesProduct = item.product?.toString() === productId.toString();
      const matchesItem = itemId ? item._id?.toString() === itemId.toString() : true;
      const itemDelivered = ['delivered', 'returned', 'refunded'].includes(String(item.itemStatus || '').toLowerCase());
      return matchesProduct && matchesItem && (itemDelivered || orderDelivered);
    });
  });
};

export const getReviewEligibility = async ({ identifier, userId }) => {
  const product = await resolveProductRecord(identifier);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const alreadyReviewed = Boolean(
      (store.reviews || []).find((review) => review.product === product._id && review.user === userId),
    );

    const purchasedOrders = (store.orders || []).filter(
      (order) => order.user === userId && order.paymentStatus === 'paid',
    );

    let hasPurchased = false;
    let deliveredOrderId = null;
    let deliveredItemId = null;

    purchasedOrders.forEach((order) => {
      const orderDelivered = ['delivered', 'returned', 'refunded'].includes(String(order.orderStatus || '').toLowerCase());
      (order.items || []).forEach((item) => {
        const matchesProduct = item.product === product._id;
        if (!matchesProduct) return;

        hasPurchased = true;
        const itemDelivered = ['delivered', 'returned', 'refunded'].includes(String(item.itemStatus || '').toLowerCase());
        if (!deliveredOrderId && (itemDelivered || orderDelivered)) {
          deliveredOrderId = order._id;
          deliveredItemId = item._id || null;
        }
      });
    });

    const isDelivered = Boolean(deliveredOrderId);
    const canReview = hasPurchased && isDelivered && !alreadyReviewed;

    return {
      productId: product._id,
      hasPurchased,
      isDelivered,
      alreadyReviewed,
      canReview,
      orderId: deliveredOrderId,
      itemId: deliveredItemId,
    };
  }

  const [alreadyReviewedDoc, orders] = await Promise.all([
    Review.findOne({ product: product._id, user: userId }).lean(),
    Order.find({ user: userId, paymentStatus: 'paid', 'items.product': product._id })
      .select('_id orderStatus items.product items.itemStatus items._id')
      .lean(),
  ]);

  let hasPurchased = false;
  let deliveredOrderId = null;
  let deliveredItemId = null;

  orders.forEach((order) => {
    const orderDelivered = ['delivered', 'returned', 'refunded'].includes(String(order.orderStatus || '').toLowerCase());
    (order.items || []).forEach((item) => {
      const matchesProduct = item.product?.toString() === product._id.toString();
      if (!matchesProduct) return;

      hasPurchased = true;
      const itemDelivered = ['delivered', 'returned', 'refunded'].includes(String(item.itemStatus || '').toLowerCase());
      if (!deliveredOrderId && (itemDelivered || orderDelivered)) {
        deliveredOrderId = order._id;
        deliveredItemId = item._id || null;
      }
    });
  });

  const alreadyReviewed = Boolean(alreadyReviewedDoc);
  const isDelivered = Boolean(deliveredOrderId);
  const canReview = hasPurchased && isDelivered && !alreadyReviewed;

  return {
    productId: product._id,
    hasPurchased,
    isDelivered,
    alreadyReviewed,
    canReview,
    orderId: deliveredOrderId,
    itemId: deliveredItemId,
  };
};

const enrichReview = async (review) => {
  if (!review) {
    return null;
  }

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const user = (store.users || []).find((entry) => entry._id === review.user) || null;
    const vendor = review.vendor ? (store.vendors || []).find((entry) => entry._id === review.vendor) || null : null;

    return {
      ...review,
      user: user ? { _id: user._id, name: user.name, email: user.email } : null,
      vendor: vendor ? { _id: vendor._id, businessName: vendor.businessName } : null,
    };
  }

  return Review.findById(review._id)
    .populate('user', 'name email')
    .populate('vendor', 'businessName')
    .lean();
};

export const getProductReviews = async (productId, query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;
  const resolvedProductId = await resolveProductId(productId);

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const product = await resolveProductRecord(productId);
    const localProductId = product?._id || productId;

    const reviews = (store.reviews || [])
      .filter((review) => review.product === localProductId && review.status === 'published')
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const paged = reviews.slice(skip, skip + limit);
    const productSummary = buildProductSummary(reviews);

    return {
      reviews: paged.map((review) => {
        const user = (store.users || []).find((entry) => entry._id === review.user) || null;
        return {
          ...review,
          user: user ? { _id: user._id, name: user.name, email: user.email } : null,
        };
      }),
      summary: productSummary,
      pagination: {
        page,
        limit,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / limit) || 1,
      },
    };
  }

  const [reviews, total, aggregate] = await Promise.all([
    Review.find({ product: resolvedProductId, status: 'published' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('vendor', 'businessName'),
    Review.countDocuments({ product: resolvedProductId, status: 'published' }),
    Review.aggregate([
      { $match: { product: resolvedProductId, status: 'published' } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    reviews,
    summary: aggregate[0]
      ? {
          averageRating: Number(aggregate[0].averageRating.toFixed(2)),
          totalReviews: aggregate[0].totalReviews,
        }
      : { averageRating: 0, totalReviews: 0 },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const createReview = async ({ productId, userId, payload }) => {
  const rating = Number(payload.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  const title = payload.title?.toString().trim() || '';
  const comment = payload.comment?.toString().trim() || '';
  const images = normalizeReviewImages(payload.images);
  const itemId = payload.itemId?.toString?.() || payload.itemId || null;

  if (shouldUseLocalStore()) {
    return mutateLocalStore(async (store) => {
      const product = (store.products || []).find((entry) => entry._id === productId || entry.slug === String(productId).toLowerCase());
      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      const alreadyReviewed = (store.reviews || []).find((review) => review.product === product._id && review.user === userId);
      if (alreadyReviewed) {
        throw new ApiError(409, 'You have already reviewed this product');
      }

      const verifiedPurchase = await verifyPurchase(userId, productId, itemId);
      const review = {
        _id: createLocalId(),
        product: product._id,
        order: payload.orderId || null,
        itemId,
        user: userId,
        vendor: product.vendor || null,
        rating,
        title,
        comment,
        images,
        status: 'published',
        isVerifiedPurchase: verifiedPurchase,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.reviews = store.reviews || [];
      store.reviews.push(review);
      await syncProductReviewSummary(product._id, store);
      return enrichReview(review);
    });
  }

  const product = await resolveProductRecord(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const alreadyReviewed = await Review.findOne({ product: product._id, user: userId });
  if (alreadyReviewed) {
    throw new ApiError(409, 'You have already reviewed this product');
  }

  const verifiedPurchase = await verifyPurchase(userId, productId, itemId);
  const review = await Review.create({
    product: product._id,
    order: payload.orderId || undefined,
    itemId: itemId || undefined,
    user: userId,
    vendor: product.vendor || undefined,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase: verifiedPurchase,
  });

  await syncProductReviewSummary(product._id);

  return enrichReview(review);
};

export const updateReview = async (reviewId, userId, payload = {}) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore(async (store) => {
      const review = (store.reviews || []).find((entry) => entry._id === reviewId);
      if (!review) {
        throw new ApiError(404, 'Review not found');
      }
      if (review.user !== userId) {
        throw new ApiError(403, 'You can only edit your own review');
      }

      if (payload.rating !== undefined) {
        const rating = Number(payload.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          throw new ApiError(400, 'Rating must be between 1 and 5');
        }
        review.rating = rating;
      }
      if (payload.title !== undefined) {
        review.title = payload.title?.toString().trim() || '';
      }
      if (payload.comment !== undefined) {
        review.comment = payload.comment?.toString().trim() || '';
      }
      if (payload.images !== undefined) {
        review.images = normalizeReviewImages(payload.images);
      }
      review.updatedAt = new Date().toISOString();
      await syncProductReviewSummary(review.product, store);
      return enrichReview(review);
    });
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }
  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  if (payload.rating !== undefined) {
    const rating = Number(payload.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Rating must be between 1 and 5');
    }
    review.rating = rating;
  }
  if (payload.title !== undefined) {
    review.title = payload.title?.toString().trim() || '';
  }
  if (payload.comment !== undefined) {
    review.comment = payload.comment?.toString().trim() || '';
  }
  if (payload.images !== undefined) {
    review.images = normalizeReviewImages(payload.images);
  }
  await review.save();
  await syncProductReviewSummary(review.product);
  return enrichReview(review);
};

export const deleteReview = async (reviewId, userId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore(async (store) => {
      const index = (store.reviews || []).findIndex((entry) => entry._id === reviewId);
      if (index === -1) {
        throw new ApiError(404, 'Review not found');
      }
      const review = store.reviews[index];
      if (review.user !== userId) {
        throw new ApiError(403, 'You can only delete your own review');
      }
      const productId = review.product;
      store.reviews.splice(index, 1);
      await syncProductReviewSummary(productId, store);
      return { deleted: true };
    });
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }
  if (review.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only delete your own review');
  }

  const productId = review.product;
  await review.deleteOne();
  await syncProductReviewSummary(productId);
  return { deleted: true };
};

export const getProductReviewSummary = async (productId) => {
  const product = await resolveProductRecord(productId);
  const resolvedProductId = product?._id || await resolveProductId(productId);
  const reviews = shouldUseLocalStore()
    ? ((await readLocalStore()).reviews || []).filter((review) => review.product?.toString() === resolvedProductId?.toString() && review.status === 'published')
    : await Review.find({ product: resolvedProductId, status: 'published' }).lean();

  return buildProductSummary(reviews);
};
