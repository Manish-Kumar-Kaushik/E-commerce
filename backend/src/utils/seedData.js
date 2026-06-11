import '../config/env.js';
import Cart from '../models/Cart.js';
import Collection from '../models/Collection.js';
import ContactMessage from '../models/ContactMessage.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';
import logger from './logger.js';
import slugify from './slugify.js';

process.env.REQUIRE_DB = 'true';

const picsum = (seed, width = 1200, height = 1600) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}`;

const sampleCollections = [
  {
    name: 'Mon Cheri',
    bannerImage: picsum('mon-cheri-banner', 1600, 900),
    description: 'Romantic occasionwear with fluid drape, gloss, and modern femininity.',
    isActive: true,
  },
  {
    name: 'Boss Mode',
    bannerImage: picsum('boss-mode-banner', 1600, 900),
    description: 'Sharp tailoring and confident silhouettes for power dressing moments.',
    isActive: true,
  },
  {
    name: 'Amore',
    bannerImage: picsum('amore-banner', 1600, 900),
    description: 'Soft texture, polished neutrals, and elevated day-to-night pieces.',
    isActive: true,
  },
  {
    name: 'Shopzy Luxe',
    bannerImage: picsum('shopzy-luxe-banner', 1600, 900),
    description: 'Statement styles with premium finishes and couture-inspired detailing.',
    isActive: true,
  },
  {
    name: 'Celebrity Closet',
    bannerImage: picsum('celebrity-closet-banner', 1600, 900),
    description: 'Camera-ready dressing inspired by red carpet and spotlight glamour.',
    isActive: true,
  },
  {
    name: 'New Arrivals',
    bannerImage: picsum('new-arrivals-banner', 1600, 900),
    description: 'Fresh drops with fashion-forward cuts, fluid movement, and luxe basics.',
    isActive: true,
  },
];

const sampleProducts = [
  {
    name: 'Ivory Satin Evening Dress',
    description: 'A softly structured satin dress with a fluid skirt, corseted bodice, and elegant evening finish.',
    price: 7990,
    salePrice: 6990,
    category: 'dresses',
    collection: 'Mon Cheri',
    tags: ['mon-cheri', 'editorial'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['ivory', 'gold'],
    stock: 7,
    isFeatured: true,
    images: [picsum('ivory-satin-evening-dress-1'), picsum('ivory-satin-evening-dress-2')],
  },
  {
    name: 'Midnight Tailored Co-ord Set',
    description: 'An all-black co-ord with a sculpted blazer top and straight-cut trousers for polished evening wear.',
    price: 8490,
    salePrice: 7490,
    category: 'co-ord sets',
    collection: 'Boss Mode',
    tags: ['boss-mode', 'tailored'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['black'],
    stock: 10,
    isFeatured: true,
    images: [picsum('midnight-tailored-coord-1'), picsum('midnight-tailored-coord-2')],
  },
  {
    name: 'Gold Mist Organza Gown',
    description: 'A luminous organza gown with volume at the hem and delicate sheen for celebratory dressing.',
    price: 11990,
    salePrice: 9990,
    category: 'gowns',
    collection: 'Shopzy Luxe',
    tags: ['shopzy-luxe', 'occasion'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['gold', 'off-white'],
    stock: 5,
    isLuxe: true,
    images: [picsum('gold-mist-organza-gown-1'), picsum('gold-mist-organza-gown-2')],
  },
  {
    name: 'Noir Cropped Jacket',
    description: 'A cropped jacket with strong shoulders, smooth lining, and a crisp city-ready silhouette.',
    price: 6290,
    salePrice: 5490,
    category: 'jackets',
    collection: 'Boss Mode',
    tags: ['boss-mode', 'wardrobe'],
    sizes: ['S', 'M', 'L'],
    colors: ['black'],
    stock: 12,
    images: [picsum('noir-cropped-jacket-1'), picsum('noir-cropped-jacket-2')],
  },
  {
    name: 'Pearl Drape Jumpsuit',
    description: 'A draped jumpsuit with a fluid neckline and soft pearl-toned finish made for event dressing.',
    price: 8990,
    salePrice: 7990,
    category: 'jumpsuits',
    collection: 'Celebrity Closet',
    tags: ['celebrity-closet', 'occasion'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['off-white'],
    stock: 6,
    isCelebrityCloset: true,
    images: [picsum('pearl-drape-jumpsuit-1'), picsum('pearl-drape-jumpsuit-2')],
  },
  {
    name: 'Sandstone Corset Top',
    description: 'A structured corset-inspired top with clean paneling and an elevated neutral tone.',
    price: 4290,
    salePrice: 3890,
    category: 'tops',
    collection: 'Amore',
    tags: ['amore', 'soft-glam'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['sand', 'beige'],
    stock: 18,
    images: [picsum('sandstone-corset-top-1'), picsum('sandstone-corset-top-2')],
  },
  {
    name: 'Ivory Wide Leg Trousers',
    description: 'Relaxed full-length trousers with a premium drape and a clean, elongated line.',
    price: 4590,
    salePrice: 4190,
    category: 'bottoms',
    collection: 'Boss Mode',
    tags: ['boss-mode', 'tailored'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['ivory'],
    stock: 14,
    images: [picsum('ivory-wide-leg-trousers-1'), picsum('ivory-wide-leg-trousers-2')],
  },
  {
    name: 'Champagne Sequin Dress',
    description: 'A statement mini with soft-gold sequins, fluid lining, and after-dark shine.',
    price: 10990,
    salePrice: 9490,
    category: 'dresses',
    collection: 'Celebrity Closet',
    tags: ['celebrity-closet', 'party'],
    sizes: ['XS', 'S', 'M'],
    colors: ['champagne', 'gold'],
    stock: 0,
    isCelebrityCloset: true,
    images: [picsum('champagne-sequin-dress-1'), picsum('champagne-sequin-dress-2')],
  },
  {
    name: 'Soft Bloom Wrap Dress',
    description: 'A wrap dress with fluid sleeves, soft movement, and polished day-to-evening appeal.',
    price: 5690,
    salePrice: 5190,
    category: 'dresses',
    collection: 'Amore',
    tags: ['amore', 'daywear'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['off-white', 'pink'],
    stock: 16,
    images: [picsum('soft-bloom-wrap-dress-1'), picsum('soft-bloom-wrap-dress-2')],
  },
  {
    name: 'Moonlight Co-ord Set',
    description: 'A softly luminous co-ord with a fluid shirt and straight pants for luxe effortless dressing.',
    price: 7290,
    salePrice: 6490,
    category: 'co-ord sets',
    collection: 'Shopzy Luxe',
    tags: ['shopzy-luxe', 'resort'],
    sizes: ['S', 'M', 'L'],
    colors: ['off-white'],
    stock: 8,
    isLuxe: true,
    images: [picsum('moonlight-coord-set-1'), picsum('moonlight-coord-set-2')],
  },
  {
    name: 'Onyx Satin Gown',
    description: 'A floor-length satin gown with a sleek neckline and dramatic evening presence.',
    price: 12490,
    salePrice: 11490,
    category: 'gowns',
    collection: 'Mon Cheri',
    tags: ['mon-cheri', 'occasion'],
    sizes: ['S', 'M', 'L'],
    colors: ['black'],
    stock: 4,
    isFeatured: true,
    images: [picsum('onyx-satin-gown-1'), picsum('onyx-satin-gown-2')],
  },
  {
    name: 'Linen Statement Top',
    description: 'A light structured top with clean volume and a breathable texture for elevated everyday wear.',
    price: 3790,
    salePrice: 3390,
    category: 'tops',
    collection: 'New Arrivals',
    tags: ['new-arrivals', 'essentials'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['white'],
    stock: 20,
    isFeatured: true,
    images: [picsum('linen-statement-top-1'), picsum('linen-statement-top-2')],
  },
  {
    name: 'Studio Drape Dress',
    description: 'A draped midi dress designed to transition from editorial daytime moments to polished dinner plans.',
    price: 6890,
    salePrice: 6290,
    category: 'dresses',
    collection: 'New Arrivals',
    tags: ['new-arrivals', 'editorial'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['cream'],
    stock: 11,
    images: [picsum('studio-drape-dress-1'), picsum('studio-drape-dress-2')],
  },
];

const sampleAddresses = [
  {
    label: 'Home',
    fullName: 'Demo User',
    phone: '9999999999',
    line1: '221B Baker Street',
    line2: 'Apt 4',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    isDefault: true,
  },
];

const clearDatabase = async () => {
  await Promise.all([
    Order.deleteMany(),
    Cart.deleteMany(),
    Product.deleteMany(),
    Collection.deleteMany(),
    NewsletterSubscriber.deleteMany(),
    ContactMessage.deleteMany(),
    Admin.deleteMany(),
    User.deleteMany(),
  ]);
};

const seedDatabase = async () => {
  await connectDB();

  await clearDatabase();

  const adminUser = await Admin.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    phone: '9999999999',
  });

  const normalUser = await User.create({
    name: 'Demo User',
    email: 'user@example.com',
    password: 'User@123',
    phone: '8888888888',
    authProvider: 'seed',
    role: 'customer',
    addresses: sampleAddresses,
  });

  const collections = await Collection.insertMany(
    sampleCollections.map((collection) => ({
      ...collection,
      slug: slugify(collection.name),
    })),
  );

  const products = await Product.insertMany(
    sampleProducts.map((product) => ({
      ...product,
      slug: slugify(product.name),
      collectionSlug: slugify(product.collection),
      images: product.images.map((url) => ({
        url,
        publicId: '',
      })),
      createdBy: adminUser._id,
    })),
  );

  logger.info('Fashion storefront database seeded successfully', {
    admin: {
      email: adminUser.email,
      password: 'Admin@123',
    },
    user: {
      email: normalUser.email,
      password: 'User@123',
    },
    collectionsCreated: collections.length,
    productsCreated: products.length,
  });
};

const clearOnly = async () => {
  await connectDB();
  await clearDatabase();
  logger.info('Database cleared successfully');
};

const run = async () => {
  try {
    if (process.argv.includes('--clear')) {
      await clearOnly();
    } else {
      await seedDatabase();
    }

    process.exit(0);
  } catch (error) {
    logger.error(`Seed command failed: ${error.message}`);
    process.exit(1);
  }
};

run();
