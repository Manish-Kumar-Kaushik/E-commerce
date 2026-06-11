import Collection from '../models/Collection.js';
import Product from '../models/Product.js';
import {
  createLocalId,
  mutateLocalStore,
  paginateCollection,
  readLocalStore,
  shouldUseLocalStore,
} from './localStoreService.js';
import ApiError from '../utils/ApiError.js';
import { buildProductFilters, parsePagination } from '../utils/queryBuilder.js';
import slugify from '../utils/slugify.js';

export const getCollections = async (query) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const filters = query.includeInactive === 'true' ? () => true : (collection) => collection.isActive !== false;
    return [...store.collections]
      .filter(filters)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  const filters = query.includeInactive === 'true' ? {} : { isActive: true };
  return Collection.find(filters).sort({ createdAt: -1 });
};

export const getCollectionBySlug = async (slug, query) => {
  if (shouldUseLocalStore()) {
    const store = await readLocalStore();
    const collection = store.collections.find((entry) => entry.slug === slug.toLowerCase());

    if (!collection) {
      throw new ApiError(404, 'Collection not found');
    }

    const filteredProducts = store.products.filter((product) => {
      if (product.collectionSlug !== collection.slug) {
        return false;
      }

      if (query.search) {
        const search = query.search.trim().toLowerCase();
        const haystack = `${product.name} ${product.description || ''}`.toLowerCase();

        if (!haystack.includes(search)) {
          return false;
        }
      }

      if (query.category && product.category !== query.category.toString().trim().toLowerCase()) {
        return false;
      }

      return true;
    });

    const sortMap = {
      featured: (left, right) => Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured)),
      price_asc: (left, right) => left.price - right.price,
      price_desc: (left, right) => right.price - left.price,
      new_arrivals: (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    };

    const sortedProducts = [...filteredProducts].sort(
      sortMap[query.sortBy] || ((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    );
    const { page, limit } = parsePagination(query);
    const { items, pagination } = paginateCollection(sortedProducts, page, limit);

    return {
      collection,
      products: items,
      pagination,
    };
  }

  const collection = await Collection.findOne({
    slug: slug.toLowerCase(),
  });

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  const { page, limit, skip } = parsePagination(query);
  const filters = {
    ...buildProductFilters(query),
    collectionSlug: collection.slug,
  };

  const sortMap = {
    featured: { isFeatured: -1, createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    new_arrivals: { createdAt: -1 },
  };

  const [products, total] = await Promise.all([
    Product.find(filters)
      .sort(sortMap[query.sortBy] || { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    collection,
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const createCollection = async (payload) =>
  shouldUseLocalStore()
    ? mutateLocalStore((store) => {
        const collection = {
          _id: createLocalId(),
          ...payload,
          slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
          isActive: payload.isActive ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (store.collections.some((entry) => entry.slug === collection.slug)) {
          throw new ApiError(409, 'slug already exists');
        }

        store.collections.push(collection);
        return collection;
      })
    : Collection.create({
        ...payload,
        slug: payload.slug ? slugify(payload.slug) : slugify(payload.name),
      });

export const updateCollection = async (collectionId, payload) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const collection = store.collections.find((entry) => entry._id === collectionId);

      if (!collection) {
        throw new ApiError(404, 'Collection not found');
      }

      const previousSlug = collection.slug;
      const previousName = collection.name;

      if (payload.name !== undefined) {
        collection.name = payload.name;
      }

      if (typeof payload.bannerImage === 'string' && payload.bannerImage.trim()) {
        collection.bannerImage = payload.bannerImage.trim();
      }

      if (payload.description !== undefined) {
        collection.description = payload.description;
      }

      if (payload.isActive !== undefined) {
        collection.isActive = payload.isActive;
      }

      collection.slug = payload.slug ? slugify(payload.slug) : slugify(collection.name);
      collection.updatedAt = new Date().toISOString();

      store.products.forEach((product) => {
        if (product.collectionSlug === previousSlug || product.collection === previousName) {
          product.collection = collection.name;
          product.collectionSlug = collection.slug;
          product.updatedAt = new Date().toISOString();
        }
      });

      return collection;
    });
  }

  const collection = await Collection.findById(collectionId);

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  const previousSlug = collection.slug;
  const previousName = collection.name;

  if (payload.name !== undefined) {
    collection.name = payload.name;
  }

  if (typeof payload.bannerImage === 'string' && payload.bannerImage.trim()) {
    collection.bannerImage = payload.bannerImage.trim();
  }

  if (payload.description !== undefined) {
    collection.description = payload.description;
  }

  if (payload.isActive !== undefined) {
    collection.isActive = payload.isActive;
  }

  collection.slug = payload.slug ? slugify(payload.slug) : slugify(collection.name);
  await collection.save();

  await Product.updateMany(
    { collectionSlug: previousSlug },
    {
      collection: collection.name,
      collectionSlug: collection.slug,
    },
  );

  if (previousName !== collection.name) {
    await Product.updateMany(
      { collection: previousName },
      {
        collection: collection.name,
      },
    );
  }

  return collection;
};

export const deleteCollection = async (collectionId) => {
  if (shouldUseLocalStore()) {
    return mutateLocalStore((store) => {
      const collection = store.collections.find((entry) => entry._id === collectionId);

      if (!collection) {
        throw new ApiError(404, 'Collection not found');
      }

      store.products.forEach((product) => {
        if (product.collectionSlug === collection.slug) {
          product.collection = '';
          product.collectionSlug = '';
          product.updatedAt = new Date().toISOString();
        }
      });

      store.collections = store.collections.filter((entry) => entry._id !== collectionId);
    });
  }

  const collection = await Collection.findById(collectionId);

  if (!collection) {
    throw new ApiError(404, 'Collection not found');
  }

  await Product.updateMany(
    { collectionSlug: collection.slug },
    {
      collection: '',
      collectionSlug: '',
    },
  );

  await collection.deleteOne();
};
