import mongoose from 'mongoose';
import { loadEnv } from '../config/loadEnv.js';
import {
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
} from '../utils/destructiveGuard.js';
import { assertProductionSafe } from '../utils/destructiveGuard.js';
import Product from '../modules/product/product.model.js';
import Category from '../modules/category/category.model.js';

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
  {
    name: "Basmati Rice - Extra Long Grain",
    description: "Premium Basmati rice with rich aroma and extra long grains. Perfect for Biryani.",
    price: 3200,
    unit: "25kg Bag",
    moq: 5,
    minOrderQty: 5,
    categoryName: "Rice & Grains",
    stock: 200,
    isActive: true
  },
  {
    name: "Sunflower Oil - Refined",
    description: "Refined sunflower oil, fortified with Vitamin A & D. Low absorption and healthy.",
    price: 1750,
    unit: "15L Tin",
    moq: 5,
    minOrderQty: 5,
    categoryName: "Edible Oils",
    stock: 300,
    isActive: true
  },
  {
    name: "Palm Oil - Wholesale",
    description: "High quality palm oil for commercial frying and cooking.",
    price: 1450,
    unit: "15L Tin",
    moq: 10,
    minOrderQty: 10,
    categoryName: "Edible Oils",
    stock: 400,
    isActive: true
  },
  {
    name: "Toor Dal - Premium Quality",
    description: "Unpolished premium Toor Dal (Pigeon Peas). Rich in protein and fiber.",
    price: 1550,
    unit: "10kg Bag",
    moq: 5,
    minOrderQty: 5,
    categoryName: "Pulses & Dals",
    stock: 250,
    isActive: true
  },
  {
    name: "Moong Dal - Yellow Split",
    description: "Clean and sorted Moong Dal. Easy to cook and highly nutritious.",
    price: 1250,
    unit: "10kg Bag",
    moq: 5,
    minOrderQty: 5,
    categoryName: "Pulses & Dals",
    stock: 200,
    isActive: true
  },
  {
    name: "Refined Sugar - Grade S30",
    description: "Pure white refined sugar, S30 grade. Direct from mills.",
    price: 2150,
    unit: "50kg Bag",
    moq: 10,
    minOrderQty: 10,
    categoryName: "Sugar & Salt",
    stock: 600,
    isActive: true
  },
  {
    name: "Iodized Salt - Industrial Pack",
    description: "Free flowing iodized salt for bulk kitchen use.",
    price: 450,
    unit: "50kg Bag",
    moq: 20,
    minOrderQty: 20,
    categoryName: "Sugar & Salt",
    stock: 1000,
    isActive: true
  }
];

const seedDB = async () => {
  try {
    logDestructiveWarning('Wholesale seed (deleteMany on products and categories, then re-inserts demo catalog)');
    assertDestructiveOperationAllowed('seedWholesale');
    // Extra hard guard: never allow wholesale seed execution in production.
    assertProductionSafe('seedWholesale');

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

const isDirectExecution = process.argv[1]?.includes('seedWholesale');

if (isDirectExecution) {
  seedDB();
}

export default seedDB;
