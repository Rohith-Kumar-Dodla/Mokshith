import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../modules/category/category.model.js';
import Product from '../modules/product/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mokshith-b2b';

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
      { name: 'Basmati Rice Extra Long', description: 'Aromatic extra-long grain basmati rice ideal for biryani and catering.', unit: '25kg bag', priceRange: [2800, 3600], stockRange: [80, 250] },
      { name: 'Broken Rice Wholesale', description: 'Economical broken rice for institutional canteens and food processing units.', unit: '50kg bag', priceRange: [900, 1300], stockRange: [150, 500] },
      { name: 'Ponni Raw Rice 10kg', description: 'South Indian Ponni raw rice with consistent grain quality and low breakage.', unit: '10kg bag', priceRange: [450, 650], stockRange: [200, 700] },
      { name: 'Whole Wheat Atta 10kg', description: 'Finely milled whole wheat flour for bakeries and retail redistribution.', unit: '10kg bag', priceRange: [380, 520], stockRange: [180, 650] },
    ],
  },
  {
    name: 'Pulses & Dal',
    products: [
      { name: 'Toor Dal Premium', description: 'Unpolished premium toor dal with high protein content for wholesale supply.', unit: '10kg bag', priceRange: [1400, 1800], stockRange: [100, 400] },
      { name: 'Moong Dal Split', description: 'Clean split moong dal with uniform size for restaurants and retailers.', unit: '10kg bag', priceRange: [1200, 1600], stockRange: [120, 450] },
      { name: 'Urad Dal Whole', description: 'Whole urad dal suitable for idli, dosa batter, and traditional recipes.', unit: '10kg bag', priceRange: [1300, 1700], stockRange: [90, 380] },
      { name: 'Chana Dal Split', description: 'Split Bengal gram dal with consistent color and low moisture content.', unit: '10kg bag', priceRange: [900, 1300], stockRange: [140, 520] },
      { name: 'Masoor Dal Red', description: 'Red masoor dal with quick cooking time and strong wholesale demand.', unit: '10kg bag', priceRange: [950, 1250], stockRange: [110, 420] },
    ],
  },
  {
    name: 'Cooking Oil',
    products: [
      { name: 'Refined Sunflower Oil 15L', description: 'Light refined sunflower oil for commercial frying and bulk kitchen use.', unit: '15L tin', priceRange: [1650, 2100], stockRange: [80, 320] },
      { name: 'Groundnut Oil Filtered', description: 'Filtered groundnut oil with rich flavor for traditional cooking businesses.', unit: '15L tin', priceRange: [1850, 2400], stockRange: [70, 280] },
      { name: 'Mustard Oil Kachi Ghani', description: 'Cold-pressed mustard oil with strong aroma for regional food brands.', unit: '15L tin', priceRange: [1750, 2300], stockRange: [60, 260] },
      { name: 'Refined Palm Oil Bulk', description: 'Cost-effective refined palm oil for high-volume frying operations.', unit: '15L tin', priceRange: [1350, 1750], stockRange: [100, 400] },
      { name: 'Rice Bran Oil Refined', description: 'Heart-friendly rice bran oil suitable for hotels and catering services.', unit: '15L tin', priceRange: [1550, 2050], stockRange: [75, 300] },
    ],
  },
  {
    name: 'Spices',
    products: [
      { name: 'Turmeric Powder Premium', description: 'Bright golden turmeric powder with high curcumin for spice distributors.', unit: '5kg pack', priceRange: [650, 950], stockRange: [120, 500] },
      { name: 'Red Chilli Powder Hot', description: 'Fiery red chilli powder blend for commercial masala and snack units.', unit: '5kg pack', priceRange: [700, 1100], stockRange: [100, 450] },
      { name: 'Coriander Powder', description: 'Freshly ground coriander powder with consistent aroma and color.', unit: '5kg pack', priceRange: [550, 850], stockRange: [130, 520] },
      { name: 'Garam Masala Blend', description: 'Ready-to-use garam masala blend for restaurants and cloud kitchens.', unit: '2kg pack', priceRange: [480, 720], stockRange: [90, 360] },
      { name: 'Cumin Seeds Whole', description: 'Whole cumin seeds with strong fragrance for spice traders and retailers.', unit: '5kg pack', priceRange: [900, 1300], stockRange: [80, 340] },
    ],
  },
  {
    name: 'Dry Fruits',
    products: [
      { name: 'California Almonds', description: 'Premium California almonds sorted for bakery and gifting businesses.', unit: '5kg box', priceRange: [3200, 4200], stockRange: [40, 180] },
      { name: 'Cashew W320 Grade', description: 'Whole cashew W320 grade with uniform size for wholesale repacking.', unit: '5kg box', priceRange: [2800, 3800], stockRange: [50, 200] },
      { name: 'Golden Raisins', description: 'Sweet golden raisins suitable for confectionery and retail packs.', unit: '5kg box', priceRange: [900, 1400], stockRange: [100, 420] },
      { name: 'Walnut Kernels', description: 'Clean walnut kernels for health food stores and premium retailers.', unit: '3kg box', priceRange: [2400, 3200], stockRange: [35, 160] },
      { name: 'Salted Pistachios', description: 'Roasted salted pistachios packed for snack distributors and hotels.', unit: '3kg box', priceRange: [2600, 3500], stockRange: [40, 170] },
    ],
  },
  {
    name: 'Beverages',
    products: [
      { name: 'Premium Tea Dust', description: 'Strong tea dust blend for tea stalls, offices, and hospitality supply.', unit: '5kg pack', priceRange: [700, 1100], stockRange: [120, 480] },
      { name: 'Roasted Coffee Beans', description: 'Medium roast coffee beans for cafes and institutional beverage service.', unit: '5kg pack', priceRange: [1800, 2600], stockRange: [50, 220] },
      { name: 'Mango Drink Concentrate', description: 'Ready-to-mix mango beverage concentrate for restaurants and caterers.', unit: '5L can', priceRange: [450, 750], stockRange: [90, 360] },
      { name: 'Mineral Water 1L Pack', description: 'Packaged mineral water cartons for offices, events, and retail chains.', unit: '24x1L case', priceRange: [180, 260], stockRange: [200, 900] },
      { name: 'Lemon Drink Mix', description: 'Instant lemon drink mix sachets for canteens and travel retail packs.', unit: '100 sachets', priceRange: [220, 360], stockRange: [150, 600] },
    ],
  },
  {
    name: 'Snacks',
    products: [
      { name: 'Namkeen Mix Assorted', description: 'Assorted savory namkeen mix for retail repacking and tea shops.', unit: '5kg pack', priceRange: [650, 950], stockRange: [100, 420] },
      { name: 'Potato Chips Bulk', description: 'Classic salted potato chips packed for multiplex and retail distribution.', unit: '5kg pack', priceRange: [700, 1050], stockRange: [90, 380] },
      { name: 'Biscuit Assorted Carton', description: 'Mixed sweet and salted biscuits for general trade and kirana supply.', unit: 'carton', priceRange: [480, 720], stockRange: [120, 500] },
      { name: 'Traditional Murukku', description: 'Crispy traditional murukku snack for festive and daily wholesale demand.', unit: '5kg pack', priceRange: [600, 900], stockRange: [80, 340] },
      { name: 'Peanut Chikki Blocks', description: 'Jaggery peanut chikki blocks for school canteens and retail counters.', unit: '5kg box', priceRange: [550, 850], stockRange: [100, 400] },
    ],
  },
  {
    name: 'Dairy Products',
    products: [
      { name: 'Full Cream Milk Powder', description: 'Full cream milk powder for bakeries, sweet shops, and beverage units.', unit: '5kg pack', priceRange: [1800, 2500], stockRange: [60, 260] },
      { name: 'Pure Cow Ghee 5L', description: 'Rich cow ghee with traditional aroma for restaurants and sweet makers.', unit: '5L tin', priceRange: [2600, 3400], stockRange: [40, 180] },
      { name: 'Fresh Paneer Blocks', description: 'Soft paneer blocks suitable for hotels, caterers, and retail chains.', unit: '5kg pack', priceRange: [1200, 1700], stockRange: [50, 220] },
      { name: 'Bulk Curd Pack', description: 'Fresh bulk curd for South Indian restaurants and institutional kitchens.', unit: '5kg pack', priceRange: [350, 550], stockRange: [80, 320] },
      { name: 'Salted Butter Blocks', description: 'Salted butter blocks for bakeries, cafes, and commercial food prep.', unit: '5kg pack', priceRange: [2200, 3000], stockRange: [45, 190] },
    ],
  },
  {
    name: 'Cleaning Supplies',
    products: [
      { name: 'Industrial Floor Cleaner', description: 'Heavy-duty floor cleaner concentrate for offices and facility management.', unit: '5L can', priceRange: [420, 680], stockRange: [100, 450] },
      { name: 'Detergent Powder Bulk', description: 'High-foam detergent powder for laundries, hostels, and housekeeping teams.', unit: '10kg pack', priceRange: [650, 950], stockRange: [120, 520] },
      { name: 'Dishwash Liquid Refill', description: 'Commercial dishwash liquid with grease-cutting formula for kitchens.', unit: '5L can', priceRange: [380, 620], stockRange: [110, 480] },
      { name: 'Toilet Cleaner Concentrate', description: 'Strong toilet cleaner for facility services and hospitality supply.', unit: '5L can', priceRange: [360, 580], stockRange: [90, 420] },
      { name: 'Handwash Refill Pack', description: 'Antibacterial handwash refill for offices, clinics, and retail restrooms.', unit: '5L can', priceRange: [340, 560], stockRange: [100, 460] },
    ],
  },
  {
    name: 'Personal Care',
    products: [
      { name: 'Bath Soap Assorted', description: 'Assorted bath soap cartons for general trade and institutional supply.', unit: 'carton', priceRange: [420, 680], stockRange: [120, 520] },
      { name: 'Shampoo Sachet Pack', description: 'Economical shampoo sachet bundles for hotels and travel retail packs.', unit: '500 sachets', priceRange: [480, 760], stockRange: [100, 440] },
      { name: 'Toothpaste Wholesale', description: 'Family-size toothpaste packs for supermarkets and distributor networks.', unit: 'carton', priceRange: [650, 980], stockRange: [90, 400] },
      { name: 'Hand Sanitizer Bulk', description: '70% alcohol hand sanitizer refill for offices, clinics, and retail.', unit: '5L can', priceRange: [520, 820], stockRange: [80, 360] },
      { name: 'Tissue Paper Box Pack', description: 'Soft tissue paper box packs for offices, restaurants, and retail shelves.', unit: '24 boxes', priceRange: [280, 460], stockRange: [150, 620] },
    ],
  },
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
  await mongoose.connect(MONGO_URI);

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

seedCatalog().catch(async (error) => {
  console.error('Catalog seed failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
