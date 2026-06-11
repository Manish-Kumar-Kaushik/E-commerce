export const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildProductFilters = (query) => {
  const filters = {};
  const parseList = (value) =>
    Array.isArray(value)
      ? value
      : value
        ? value
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean)
        : [];

  if (query.search) {
    const searchRegex = {
      $regex: query.search.trim(),
      $options: 'i',
    };

    filters.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { collection: searchRegex },
      { collectionSlug: searchRegex },
      { tags: searchRegex },
      { slug: searchRegex },
    ];
  }

  if (query.category) {
    const categories = parseList(query.category);
    filters.category = categories.length > 1 ? { $in: categories } : categories[0];
  }

  if (query.collection) {
    filters.collectionSlug = query.collection.toString().trim().toLowerCase();
  }

  if (query.vendorId) {
    filters.createdBy = query.vendorId;
  }

  if (query.publicOnly === 'true') {
    filters.vendor = { $exists: true, $ne: null };
  }

  if (query.size) {
    filters.sizes = {
      $in: parseList(query.size).map((size) => size.toUpperCase()),
    };
  }

  if (query.color) {
    filters.colors = {
      $in: parseList(query.color),
    };
  }

  if (query.tag) {
    filters.tags = {
      $in: parseList(query.tag),
    };
  }

  if (query.isFeatured === 'true') {
    filters.isFeatured = true;
  }

  if (query.isCelebrityCloset === 'true') {
    filters.isCelebrityCloset = true;
  }

  if (query.isLuxe === 'true') {
    filters.isLuxe = true;
  }

  if (query.minPrice || query.maxPrice) {
    filters.price = {};

    if (query.minPrice) {
      filters.price.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filters.price.$lte = Number(query.maxPrice);
    }
  }

  return filters;
};

export const buildUserFilters = (query) => {
  const filters = {};

  if (query.role) {
    filters.role = query.role;
  }

  if (query.search) {
    filters.$or = [
      {
        name: {
          $regex: query.search.trim(),
          $options: 'i',
        },
      },
      {
        email: {
          $regex: query.search.trim(),
          $options: 'i',
        },
      },
    ];
  }

  return filters;
};
