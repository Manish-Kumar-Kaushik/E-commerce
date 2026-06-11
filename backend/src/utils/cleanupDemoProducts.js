import '../config/env.js';
import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import connectDB from '../config/db.js';
import logger from './logger.js';

process.env.REQUIRE_DB = 'true';

const isDemoProduct = (product) =>
  product?.images?.some((image) => {
    const imageUrl = typeof image === 'string' ? image : image?.url || '';
    const publicId = typeof image === 'string' ? '' : image?.publicId || '';

    return (
      imageUrl.includes('picsum.photos/') ||
      publicId.startsWith('demo-')
    );
  });

const cleanupLocalStore = () => {
  // Check both possible locations for local-store.json
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'local-store.json'),
    path.join(process.cwd(), 'backend', 'data', 'local-store.json'),
  ];

  let localStorePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      localStorePath = p;
      break;
    }
  }

  if (!localStorePath) {
    logger.info('Local store file not found, skipping local store cleanup');
    return;
  }

  try {
    const storeData = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    const originalProductCount = storeData.products.length;

    // Filter out demo products
    storeData.products = storeData.products.filter((product) => !isDemoProduct(product));

    const deletedCount = originalProductCount - storeData.products.length;

    if (deletedCount > 0) {
      fs.writeFileSync(localStorePath, JSON.stringify(storeData, null, 2));
      logger.info(`Deleted ${deletedCount} demo products from local store (${localStorePath})`);
    } else {
      logger.info('No demo products found in local store');
    }
  } catch (error) {
    logger.error('Error cleaning up local store:', error);
  }
};

const cleanupMongoDB = async () => {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Find all products
    const allProducts = await Product.find({});
    logger.info(`Found ${allProducts.length} total products`);

    // Find demo products
    const demoProducts = allProducts.filter(isDemoProduct);
    logger.info(`Found ${demoProducts.length} demo products`);

    if (demoProducts.length === 0) {
      logger.info('No demo products to delete');
      return;
    }

    // Log demo product names
    demoProducts.forEach((product) => {
      logger.info(`Demo product: ${product.name} (${product._id})`);
    });

    // Delete demo products
    const demoProductIds = demoProducts.map((p) => p._id);
    const result = await Product.deleteMany({ _id: { $in: demoProductIds } });

    logger.info(`Deleted ${result.deletedCount} demo products from MongoDB`);
  } catch (error) {
    logger.error('Error cleaning up MongoDB:', error);
  }
};

const cleanupDemoProducts = async () => {
  logger.info('Starting demo product cleanup...');
  
  // Always clean local store first
  cleanupLocalStore();
  
  // Then try MongoDB cleanup
  await cleanupMongoDB();
  
  logger.info('Demo product cleanup complete');
  process.exit(0);
};

cleanupDemoProducts();
