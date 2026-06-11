import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import {
  createLocalId,
  mutateLocalStore,
  paginateCollection,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';
import { buildProductPricingWithGst } from '../utils/gst.js';
import { buildProductFilters, parsePagination } from '../utils/queryBuilder.js';
import slugify from '../utils/slugify.js';
import { getProductReviewSummary } from './reviewService.js';

const normalizeImages = (images = []) =>
  images.map((image) =>
    typeof image === 'string'
      ? {
          url: image,
          publicId: '',
        }
      : image,
  );

const normalizeColorImageMap = (colorImages = {}) => {
  if (!colorImages || typeof colorImages !== 'object') {
    return {};
  }

  return Object.entries(colorImages).reduce((acc, [color, images]) => {
    const normalizedColor = color?.toString().trim().toLowerCase();
    if (!normalizedColor) {
      return acc;
    }

    const normalizedImages = normalizeImages(Array.isArray(images) ? images : [])
      .filter((image) => image?.url);

    if (normalizedImages.length) {
      acc[normalizedColor] = normalizedImages;
    }

    return acc;
  }, {});
};

const normalizeList = (value = [], transform = (item) => item) =>
  (Array.isArray(value) ? value : [value]).flatMap((item) =>
    typeof item === 'string' ? item.split(',') : item,
  )
    .map((item) => transform(item.toString().trim()))
    .filter(Boolean);

const normalizeAttributes = (attributes = []) => {
  if (!Array.isArray(attributes)) {
    return [];
  }

  return attributes
    .map((attribute) => {
      if (!attribute || typeof attribute !== 'object') {
        return null;
      }

      const section = typeof attribute.section === 'string' && attribute.section.trim()
        ? attribute.section.trim()
        : 'Specifications';
      const label = typeof attribute.label === 'string' ? attribute.label.trim() : '';
      const value = typeof attribute.value === 'string' ? attribute.value.trim() : '';
      const key = typeof attribute.key === 'string' && attribute.key.trim() ? attribute.key.trim() : slugify(label || section);

      if (!label || !value) {
        return null;
      }

      return {
        section,
        key,
        label,
        value,
      };
    })
    .filter(Boolean);
};

const validateSalePrice = (price, salePrice) => {
  if (salePrice !== null && salePrice !== undefined && Number(salePrice) > Number(price)) {
    throw new ApiError(400, 'Sale price must be less than or equal to price');
  }
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const hasComputedPricingInput = (payload = {}) =>
  ['basePrice', 'gstRate', 'discountAmount'].some((key) => hasOwn(payload, key));

const normalizePricingPayload = (payload = {}, existingProduct = null) => {
  if (!hasComputedPricingInput(payload)) {
    return {};
  }

  if (!existingProduct && (payload.basePrice === undefined || payload.basePrice === null || payload.basePrice === '')) {
    throw new ApiError(400, 'Base price is required');
  }

  const category = payload.category ?? existingProduct?.category;
  const basePrice =
    payload.basePrice
    ?? existingProduct?.basePrice
    ?? payload.price
    ?? existingProduct?.price
    ?? 0;
  const gstRate = payload.gstRate ?? existingProduct?.gstRate;
  const discountAmount = payload.discountAmount ?? existingProduct?.discountAmount ?? 0;

  try {
    return buildProductPricingWithGst({
      category,
      basePrice,
      gstRate,
      discountAmount,
    });
  } catch (error) {
    throw new ApiError(400, error.message || 'Unable to calculate product price');
  }
};

const getSortOption = (sortBy) => {
  switch (sortBy) {
    case 'featured':
      return { isFeatured: -1, createdAt: -1 };
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'new_arrivals':
      return { createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    default:
      return { createdAt: -1 };
  }
};

const normalizeProductPayload = (payload = {}, existingProduct = null) => {
  const collection =
    typeof payload.collection === 'string' && payload.collection.trim() ? payload.collection.trim() : '';

  return {
    ...payload,
    slug: payload.slug ? slugify(payload.slug) : payload.name ? slugify(payload.name) : undefined,
    collection,
    collectionSlug:
      payload.collectionSlug !== undefined
        ? slugify(payload.collectionSlug)
        : collection
          ? slugify(collection)
          : undefined,
    images: payload.images ? normalizeImages(payload.images) : undefined,
    colorImages: payload.colorImages !== undefined ? normalizeColorImageMap(payload.colorImages) : undefined,
    tags: payload.tags ? normalizeList(payload.tags, (item) => item.toLowerCase()) : undefined,
    attributes: payload.attributes !== undefined ? normalizeAttributes(payload.attributes) : undefined,
    sizes: payload.sizes ? normalizeList(payload.sizes, (item) => item.toUpperCase()) : undefined,
    colors: payload.colors ? normalizeList(payload.colors, (item) => item.toLowerCase()) : undefined,
    ...normalizePricingPayload(payload, existingProduct),
  };
};

const applyLocalProductFilters = (products, query = {}) =>
  products.filter((product) => {
    if (query.publicOnly === 'true') {
      if (!product.vendor) {
        return false;
      }

      if (product.isPublished === false || Number(product.stock || 0) <= 0) {
        return false;
      }
    }

    if (query.search) {
      const search = query.search.trim().toLowerCase();
      const haystack = [
        product.name,
        product.description,
        product.category,
        product.collection,
        product.collectionSlug,
        Array.isArray(product.tags) ? product.tags.join(' ') : '',
        product.slug,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (query.category) {
      const categories = query.category.toString().split(',').map((item) => item.trim().toLowerCase());

      if (!categories.includes(product.category)) {
        return false;
      }
    }

    if (query.collection && product.collectionSlug !== query.collection.toString().trim().toLowerCase()) {
      return false;
    }

    if (query.size) {
      const sizes = query.size.toString().split(',').map((item) => item.trim().toUpperCase());

      if (!sizes.some((size) => product.sizes?.includes(size))) {
        return false;
      }
    }

    if (query.color) {
      const colors = query.color.toString().split(',').map((item) => item.trim().toLowerCase());

      if (!colors.some((color) => product.colors?.includes(color))) {
        return false;
      }
    }

    if (query.tag) {
      const tags = query.tag.toString().split(',').map((item) => item.trim().toLowerCase());

      if (!tags.some((tag) => product.tags?.includes(tag))) {
        return false;
      }
    }

    if (query.isFeatured === 'true' && !product.isFeatured) {
      return false;
    }

    if (query.isCelebrityCloset === 'true' && !product.isCelebrityCloset) {
      return false;
    }

    if (query.isLuxe === 'true' && !product.isLuxe) {
      return false;
    }

    if (query.vendorId) {
      const createdBy = typeof product.createdBy === 'string' ? product.createdBy : product.createdBy?._id;

      if (createdBy !== query.vendorId) {
        return false;
      }
    }

    if (query.minPrice && Number(product.price) < Number(query.minPrice)) {
      return false;
    }

    if (query.maxPrice && Number(product.price) > Number(query.maxPrice)) {
      return false;
    }

    return true;
  });

const sortLocalProducts = (products, sortBy) => {
  const items = [...products];

  switch (sortBy) {
    case 'featured':
      return items.sort((left, right) => {
        if (Boolean(right.isFeatured) !== Boolean(left.isFeatured)) {
          return Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
        }

        return new Date(right.createdAt) - new Date(left.createdAt);
      });
    case 'price_asc':
      return items.sort((left, right) => left.price - right.price);
    case 'price_desc':
      return items.sort((left, right) => right.price - left.price);
    case 'oldest':
      return items.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    case 'new_arrivals':
    default:
      return items.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }
};

const normalizeAddress = (address = {}) => {
  const segments = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  return {
    ...address,
    display: segments.join(', '),
  };
};

const enrichProductWithVendorDetails = async (productLike) => {
  if (!productLike) {
    return productLike;
  }

  const product = typeof productLike.toJSON === 'function'
    ? productLike.toJSON({ flattenMaps: true })
    : typeof productLike.toObject === 'function'
      ? productLike.toObject({ flattenMaps: true })
      : { ...productLike };

  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const vendor = (store.vendors || []).find(
      (entry) => entry._id === product.vendor || entry.user === product.createdBy,
    );

    if (!vendor) {
      return product;
    }

    return {
      ...product,
      vendor: vendor._id,
      vendorName: vendor.businessName || 'Shopzy Seller',
      vendorStatus: vendor.status,
      vendorDetails: {
        id: vendor._id,
        businessName: vendor.businessName || 'Shopzy Seller',
        businessEmail: vendor.businessEmail || '',
        businessPhone: vendor.businessPhone || '',
        businessAddress: normalizeAddress(vendor.businessAddress || {}),
        status: vendor.status,
      },
    };
  }

  const vendorId = product.vendor?._id || product.vendor;
  const fallbackUserId = product.createdBy?._id || product.createdBy;
  const vendor = vendorId
    ? await Vendor.findById(vendorId)
    : fallbackUserId
      ? await Vendor.findOne({ user: fallbackUserId })
      : null;

  if (!vendor) {
    return product;
  }

  return {
    ...product,
    vendor: vendor._id,
    vendorName: vendor.businessName || 'Shopzy Seller',
    vendorStatus: vendor.status,
    vendorDetails: {
      id: vendor._id,
      businessName: vendor.businessName || 'Shopzy Seller',
      businessEmail: vendor.businessEmail || '',
      businessPhone: vendor.businessPhone || '',
      businessAddress: normalizeAddress(vendor.businessAddress || {}),
      status: vendor.status,
    },
  };
};

export const createProduct = async (payload, createdBy) => {
  if (!hasComputedPricingInput(payload)) {
    validateSalePrice(payload.price, payload.salePrice);
  }

  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const normalizedPayload = normalizeProductPayload(payload);
      const slug = normalizedPayload.slug || slugify(normalizedPayload.name);
      const vendor = (store.vendors || []).find(
        (entry) => entry.user === createdBy && entry.status === 'approved',
      );

      if (!vendor) {
        throw new ApiError(403, 'Only admin-approved vendors can create products');
      }

      if (store.products.some((product) => product.slug === slug)) {
        throw new ApiError(409, 'slug already exists');
      }

      const product = {
        _id: createLocalId(),
        ...normalizedPayload,
        slug,
        collectionSlug: normalizedPayload.collectionSlug ?? (normalizedPayload.collection ? slugify(normalizedPayload.collection) : ''),
        createdBy,
        vendor: vendor._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.products.push(product);
      return product;
    });
  }

  const vendor = await Vendor.findOne({ user: createdBy, status: 'approved' });

  if (!vendor) {
    throw new ApiError(403, 'Only admin-approved vendors can create products');
  }

  const product = await Product.create({
    ...normalizeProductPayload(payload),
    createdBy,
    vendor: vendor._id,
    approvalStatus: 'approved',
    adminApproved: true,
    isPublished: true,
  });

  return product;
};

export const updateProduct = async (productId, payload, actor) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const product = store.products.find((entry) => entry._id === productId);

      if (!product) {
        throw new ApiError(404, 'Product not found');
      }

      if (product.createdBy !== actor?._id?.toString()) {
        throw new ApiError(403, 'You can only update your own products');
      }

      const normalizedPayload = normalizeProductPayload(payload, product);

      if (!hasComputedPricingInput(payload)) {
        const nextPrice = payload.price ?? product.price;
        const nextSalePrice =
          payload.salePrice === ''
            ? null
            : payload.salePrice !== undefined
              ? payload.salePrice
              : product.salePrice;

        validateSalePrice(nextPrice, nextSalePrice);
        product.salePrice = nextSalePrice;
      }

      if (normalizedPayload.name !== undefined) product.name = normalizedPayload.name;
      if (normalizedPayload.description !== undefined) product.description = normalizedPayload.description;
      if (normalizedPayload.basePrice !== undefined) product.basePrice = normalizedPayload.basePrice;
      if (normalizedPayload.gstRate !== undefined) product.gstRate = normalizedPayload.gstRate;
      if (normalizedPayload.gstAmount !== undefined) product.gstAmount = normalizedPayload.gstAmount;
      if (normalizedPayload.discountAmount !== undefined) product.discountAmount = normalizedPayload.discountAmount;
      if (normalizedPayload.isPriceInclusiveOfGst !== undefined) product.isPriceInclusiveOfGst = normalizedPayload.isPriceInclusiveOfGst;
      if (normalizedPayload.price !== undefined) product.price = normalizedPayload.price;
      if (normalizedPayload.salePrice !== undefined) product.salePrice = normalizedPayload.salePrice;
      if (normalizedPayload.category !== undefined) product.category = normalizedPayload.category;
      if (normalizedPayload.collection !== undefined) product.collection = normalizedPayload.collection;
      if (normalizedPayload.collectionSlug !== undefined) product.collectionSlug = normalizedPayload.collectionSlug;
      if (normalizedPayload.images !== undefined) product.images = normalizedPayload.images;
      if (normalizedPayload.colorImages !== undefined) product.colorImages = normalizedPayload.colorImages;
      if (normalizedPayload.tags !== undefined) product.tags = normalizedPayload.tags;
      if (normalizedPayload.attributes !== undefined) product.attributes = normalizedPayload.attributes;
      if (normalizedPayload.sizes !== undefined) product.sizes = normalizedPayload.sizes;
      if (normalizedPayload.colors !== undefined) product.colors = normalizedPayload.colors;
      if (normalizedPayload.stock !== undefined) product.stock = normalizedPayload.stock;
      if (normalizedPayload.isFeatured !== undefined) product.isFeatured = normalizedPayload.isFeatured;
      if (normalizedPayload.isCelebrityCloset !== undefined) product.isCelebrityCloset = normalizedPayload.isCelebrityCloset;
      if (normalizedPayload.isLuxe !== undefined) product.isLuxe = normalizedPayload.isLuxe;
      if (normalizedPayload.slug !== undefined) {
        product.slug = normalizedPayload.slug;
      } else if (payload.slug) {
        product.slug = slugify(payload.slug);
      } else if (payload.name) {
        product.slug = slugify(payload.name);
      }

      product.collectionSlug =
        payload.collectionSlug !== undefined
          ? slugify(payload.collectionSlug)
          : payload.collection
            ? slugify(payload.collection)
            : product.collectionSlug;
      product.updatedAt = new Date().toISOString();

      return product;
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.createdBy?.toString() !== actor?._id?.toString()) {
    throw new ApiError(403, 'You can only update your own products');
  }

  const normalizedPayload = normalizeProductPayload(payload, product);

  if (!hasComputedPricingInput(payload)) {
    const nextPrice = payload.price ?? product.price;
    const nextSalePrice =
      payload.salePrice === ''
        ? null
        : payload.salePrice !== undefined
          ? payload.salePrice
          : product.salePrice;

    validateSalePrice(nextPrice, nextSalePrice);
    product.salePrice = nextSalePrice;
  }

  if (normalizedPayload.name !== undefined) product.name = normalizedPayload.name;
  if (normalizedPayload.description !== undefined) product.description = normalizedPayload.description;
  if (normalizedPayload.basePrice !== undefined) product.basePrice = normalizedPayload.basePrice;
  if (normalizedPayload.gstRate !== undefined) product.gstRate = normalizedPayload.gstRate;
  if (normalizedPayload.gstAmount !== undefined) product.gstAmount = normalizedPayload.gstAmount;
  if (normalizedPayload.discountAmount !== undefined) product.discountAmount = normalizedPayload.discountAmount;
  if (normalizedPayload.isPriceInclusiveOfGst !== undefined) product.isPriceInclusiveOfGst = normalizedPayload.isPriceInclusiveOfGst;
  if (normalizedPayload.price !== undefined) product.price = normalizedPayload.price;
  if (normalizedPayload.salePrice !== undefined) product.salePrice = normalizedPayload.salePrice;
  if (normalizedPayload.category !== undefined) product.category = normalizedPayload.category;
  if (normalizedPayload.collection !== undefined) product.collection = normalizedPayload.collection;
  if (normalizedPayload.collectionSlug !== undefined) product.collectionSlug = normalizedPayload.collectionSlug;
  if (normalizedPayload.images !== undefined) product.images = normalizedPayload.images;
  if (normalizedPayload.colorImages !== undefined) product.colorImages = normalizedPayload.colorImages;
  if (normalizedPayload.tags !== undefined) product.tags = normalizedPayload.tags;
  if (normalizedPayload.attributes !== undefined) product.attributes = normalizedPayload.attributes;
  if (normalizedPayload.sizes !== undefined) product.sizes = normalizedPayload.sizes;
  if (normalizedPayload.colors !== undefined) product.colors = normalizedPayload.colors;
  if (normalizedPayload.stock !== undefined) product.stock = normalizedPayload.stock;
  if (normalizedPayload.isFeatured !== undefined) product.isFeatured = normalizedPayload.isFeatured;
  if (normalizedPayload.isCelebrityCloset !== undefined) product.isCelebrityCloset = normalizedPayload.isCelebrityCloset;
  if (normalizedPayload.isLuxe !== undefined) product.isLuxe = normalizedPayload.isLuxe;

  if (payload.slug) {
    product.slug = slugify(payload.slug);
  } else if (payload.name) {
    product.slug = slugify(payload.name);
  }

  await product.save();
  return product;
};

export const deleteProduct = async (productId, actor) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const index = store.products.findIndex((entry) => entry._id === productId);

      if (index === -1) {
        throw new ApiError(404, 'Product not found');
      }

      if (store.products[index].createdBy !== actor?._id?.toString()) {
        throw new ApiError(403, 'You can only delete your own products');
      }

      store.products.splice(index, 1);
      store.carts.forEach((cart) => {
        cart.items = cart.items.filter((item) => item.product !== productId);
      });
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.createdBy?.toString() !== actor?._id?.toString()) {
    throw new ApiError(403, 'You can only delete your own products');
  }

  await product.deleteOne();
};

export const getProductBySlug = async (identifier, query = {}) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const product = store.products.find(
      (entry) => entry._id === identifier || entry.slug === identifier.toLowerCase(),
    );

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    if (query.publicOnly === 'true' && (!product.vendor || product.isPublished === false || Number(product.stock || 0) <= 0)) {
      throw new ApiError(404, 'Product not found');
    }

    const enrichedLocal = await enrichProductWithVendorDetails(product);
    const reviewSummaryLocal = await getProductReviewSummary(enrichedLocal._id);
    return {
      ...enrichedLocal,
      reviewSummary: reviewSummaryLocal,
    };
  }

  const lookupQuery = identifier.match(/^[0-9a-fA-F]{24}$/)
    ? {
        $or: [{ _id: identifier }, { slug: identifier.toLowerCase() }],
      }
    : { slug: identifier.toLowerCase() };
  const product2 = await Product.findOne(lookupQuery).populate('vendor', 'businessName businessEmail businessPhone businessAddress status');

  if (!product2) {
    throw new ApiError(404, 'Product not found');
  }

  if (query.publicOnly === 'true' && (!product2.vendor || product2.isPublished === false || Number(product2.stock || 0) <= 0)) {
    throw new ApiError(404, 'Product not found');
  }

  const enriched = await enrichProductWithVendorDetails(product2);
  const reviewSummary = await getProductReviewSummary(enriched._id);
  return {
    ...enriched,
    reviewSummary,
  };
};

export const getProducts = async (query) => {
  if (shouldUseLocalStore()) {
    const { page, limit } = parsePagination(query);
    const store = await readLocalStore();
    const filteredProducts = applyLocalProductFilters(store.products, query);
    const sortedProducts = sortLocalProducts(filteredProducts, query.sortBy);
    const { items, pagination } = paginateCollection(sortedProducts, page, limit);

    return {
      products: items,
      pagination,
    };
  }

  const { page, limit, skip } = parsePagination(query);
  const filters = buildProductFilters(query);
  const sort = getSortOption(query.sortBy);

  if (query.publicOnly === 'true') {
    filters.stock = { $gt: 0 };
  }

  const [products, total] = await Promise.all([
    Product.find(filters).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
