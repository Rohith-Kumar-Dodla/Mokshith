// MOVED: seedWholesale moved to dangerous-dev-tools
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/loadEnv.js';
import {
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
  REQUIRED_DESTRUCTIVE_CONFIRM,
} from '../src/utils/destructiveGuard.js';
import Product from '../src/modules/product/product.model.js';
import Category from '../src/modules/category/category.model.js';

loadEnv();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const categories = [
  { name: "Rice & Grains", slug: "rice-grains" },
  { name: "Edible Oils", slug: "edible-oils" },
  { name: "Pulses & Dals", slug: "pulses-dals" },
  { name: "Sugar & Salt", slug: "sugar-salt" },
  { name: "Spices", slug: "spices" }
];

const products = [
  {
    name: "Sona Masoori Rice - Premium",
    description: "High quality Sona Masoori rice, aged for 12 months. Ideal for daily use and restaurants.",
    price: 1350,
    unit: "25kg Bag",
    moq: 10,
    minOrderQty: 10,
    categoryName: "Rice & Grains",
    stock: 500,
    isActive: true
  },
  // ... more products ...
];

const seedDB = async () => {
  try {
    logDestructiveWarning('Wholesale seed (deleteMany on products and categories, then re-inserts demo catalog)');
    assertDestructiveOperationAllowed('seedWholesale');

    if (!MONGODB_URI) {
      throw new Error('MONGO_URI is required');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    assertExpectedApplicationDatabase(mongoose.connection.name);
    console.log('Connected!');

    console.log('Clearing existing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('Seeding categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`Seeded ${createdCategories.length} categories.`);

    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('Seeding products...');
    const productsToInsert = products.map(p => {
      const { categoryName, ...productData } = p;
      return {
        ...productData,
        categoryId: categoryMap[categoryName]
      };
    });

    const createdProducts = await Product.insertMany(productsToInsert);
    console.log(`Seeded ${createdProducts.length} wholesale products.`);

    console.log('Seeding complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding database:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

const isDirectExecution = process.argv[1]?.includes('dangerous-dev-tools/seedWholesale.js') || process.argv[1]?.includes('/dangerous-dev-tools/seedWholesale.js') || process.argv[1]?.endsWith('seedWholesale.js');

if (isDirectExecution) {
  (async () => {
    if (process.env.NODE_ENV === 'production') {
      console.error('Refusing to run destructive script in production');
      process.exit(1);
    }
    if (process.env.DESTRUCTIVE_CONFIRM !== REQUIRED_DESTRUCTIVE_CONFIRM) {
      console.error(`Set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM} to enable destructive scripts`);
      process.exit(1);
    }
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => rl.question(`Type "${REQUIRED_DESTRUCTIVE_CONFIRM}" to confirm destructive action: `, resolve));
    rl.close();
    if (answer !== process.env.DESTRUCTIVE_CONFIRM) {
      console.error('Interactive confirmation failed. Aborting.');
      process.exit(1);
    }
    await seedDB();
  })();
}

export default seedDB;
