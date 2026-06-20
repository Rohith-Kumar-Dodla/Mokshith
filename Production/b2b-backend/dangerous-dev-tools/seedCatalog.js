// MOVED: seedCatalog moved to dangerous-dev-tools
import mongoose from 'mongoose';
import { loadEnv } from '../src/config/loadEnv.js';
import {
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
  REQUIRED_DESTRUCTIVE_CONFIRM,
} from '../src/utils/destructiveGuard.js';
import Category from '../src/modules/category/category.model.js';
import Product from '../src/modules/product/product.model.js';

loadEnv();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORY_CATALOG = [
  {
    name: 'Rice & Grains',
    products: [
      { name: 'Sona Masoori Rice 25kg', description: 'Premium aged Sona Masoori rice suitable for daily commercial kitchen use.', unit: '25kg bag', priceRange: [1200, 1600], stockRange: [120, 600] },
      // ... more product definitions ...
    ],
  },
  // ... more categories ...
];

const randomInRange = ([min, max]) => Math.floor(Math.random() * (max - min + 1)) + min;

async function findExistingCloudinaryUrl() {
  const productWithImage = await Product.findOne({
    $or: [
      { image: /cloudinary/i },
      { imageUrl: /cloudinary/i },
    ],
  })
    .select('image imageUrl')
    .lean();

  if (productWithImage?.image?.includes('cloudinary')) {
    return productWithImage.image;
  }
  if (productWithImage?.imageUrl?.includes('cloudinary')) {
    return productWithImage.imageUrl;
  }

  const categoryWithImage = await Category.findOne({ image: /cloudinary/i })
    .select('image')
    .lean();

  return categoryWithImage?.image || null;
}

async function seedCatalog() {
  logDestructiveWarning('Catalog seed (creates categories and products automatically)');
  assertDestructiveOperationAllowed('seedCatalog');

  if (!MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(MONGO_URI);
  assertExpectedApplicationDatabase(mongoose.connection.name);

  const placeholderImage = await findExistingCloudinaryUrl();
  let categoriesCreated = 0;
  let productsCreated = 0;
  let categoriesSkipped = 0;
  let productsSkipped = 0;

  for (const categoryDef of CATEGORY_CATALOG) {
    let category = await Category.findOne({ name: categoryDef.name });

    if (!category) {
      category = await Category.create({
        name: categoryDef.name,
        slug: slugify(categoryDef.name),
        description: `${categoryDef.name} wholesale category for B2B buyers.`,
        isActive: true,
        ...(placeholderImage ? { image: placeholderImage } : {}),
      });
      categoriesCreated += 1;
    } else {
      categoriesSkipped += 1;
      if (placeholderImage && !category.image) {
        category.image = placeholderImage;
        await category.save();
      }
    }

    for (const productDef of categoryDef.products) {
      const existingProduct = await Product.findOne({
        name: productDef.name,
        categoryId: category._id,
      });

      if (existingProduct) {
        productsSkipped += 1;
        continue;
      }

      const price = randomInRange(productDef.priceRange);
      const stock = randomInRange(productDef.stockRange);
      const moq = Math.max(1, Math.floor(stock / 50));

      await Product.create({
        name: productDef.name,
        description: productDef.description,
        price,
        stock,
        categoryId: category._id,
        unit: productDef.unit,
        minOrderQty: moq,
        moq,
        isActive: true,
        ...(placeholderImage
          ? { image: placeholderImage, imageUrl: placeholderImage }
          : {}),
      });
      productsCreated += 1;
    }
  }

  console.log('Catalog seed completed');
  console.log(`Categories created: ${categoriesCreated}`);
  console.log(`Categories skipped: ${categoriesSkipped}`);
  console.log(`Products created: ${productsCreated}`);
  console.log(`Products skipped: ${productsSkipped}`);
  console.log(`Placeholder image used: ${placeholderImage ? 'yes' : 'no'}`);

  await mongoose.disconnect();
}

const isDirectExecution = process.argv[1]?.includes('dangerous-dev-tools/seedCatalog.js') || process.argv[1]?.includes('/dangerous-dev-tools/seedCatalog.js') || process.argv[1]?.endsWith('seedCatalog.js');

if (isDirectExecution) {
  (async () => {
    try {
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

      await seedCatalog();
    } catch (error) {
      console.error('Catalog seed failed:', error.message || error);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    }
  })();
}

export default seedCatalog;
