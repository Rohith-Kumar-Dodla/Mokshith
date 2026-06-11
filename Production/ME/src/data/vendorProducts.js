export const vendorProducts = [
  {
    id: 'PRD001',
    name: 'Basmati Rice Premium',
    category: 'Grains & Rice',
    brand: 'India Gate',
    description: 'Premium quality basmati rice aged for 2 years, extra long grain, perfect for biryani and special dishes',
    price: 85.00,
    mrp: 95.00,
    wholesalePrice: 75.00,
    stock: 450,
    minimumOrderQuantity: 25,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-10',
    sales: 1250,
    rating: 4.8,
    reviews: 245,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 85.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 80.00, discount: 6 },
      { minQty: 101, maxQty: 500, price: 75.00, discount: 12 },
      { minQty: 501, maxQty: null, price: 70.00, discount: 18 }
    ],
    tags: ['premium', 'bestseller', 'organic']
  },
  {
    id: 'PRD002',
    name: 'Toor Dal (Pigeon Pea)',
    category: 'Pulses & Dal',
    brand: 'Tata Sampann',
    description: 'Premium quality toor dal, unpolished and organic, rich in protein',
    price: 120.00,
    mrp: 135.00,
    wholesalePrice: 105.00,
    stock: 320,
    minimumOrderQuantity: 20,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-12',
    sales: 980,
    rating: 4.7,
    reviews: 189,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 120.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 112.00, discount: 7 },
      { minQty: 101, maxQty: 500, price: 105.00, discount: 13 },
      { minQty: 501, maxQty: null, price: 98.00, discount: 18 }
    ],
    tags: ['organic', 'protein-rich']
  },
  {
    id: 'PRD003',
    name: 'Sunflower Oil 5L',
    category: 'Cooking Oil',
    brand: 'Fortune',
    description: 'Refined sunflower oil, cholesterol free, high smoking point, light and healthy',
    price: 450.00,
    mrp: 495.00,
    wholesalePrice: 400.00,
    stock: 180,
    minimumOrderQuantity: 10,
    unit: 'litre',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-15',
    sales: 756,
    rating: 4.6,
    reviews: 156,
    bulkPricing: [
      { minQty: 1, maxQty: 20, price: 450.00, discount: 0 },
      { minQty: 21, maxQty: 50, price: 425.00, discount: 6 },
      { minQty: 51, maxQty: 100, price: 400.00, discount: 11 },
      { minQty: 101, maxQty: null, price: 375.00, discount: 17 }
    ],
    tags: ['heart-healthy', 'light']
  },
  {
    id: 'PRD004',
    name: 'Wheat Flour (Atta) 25kg',
    category: 'Flour & Atta',
    brand: 'Aashirvaad',
    description: 'Whole wheat chakki atta, stone ground, rich in fiber, perfect for rotis',
    price: 650.00,
    mrp: 720.00,
    wholesalePrice: 580.00,
    stock: 95,
    minimumOrderQuantity: 5,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-18',
    sales: 634,
    rating: 4.9,
    reviews: 198,
    bulkPricing: [
      { minQty: 1, maxQty: 10, price: 650.00, discount: 0 },
      { minQty: 11, maxQty: 25, price: 615.00, discount: 5 },
      { minQty: 26, maxQty: 50, price: 580.00, discount: 11 },
      { minQty: 51, maxQty: null, price: 545.00, discount: 16 }
    ],
    tags: ['whole-wheat', 'fiber-rich', 'bestseller']
  },
  {
    id: 'PRD005',
    name: 'Sugar Premium 50kg',
    category: 'Sugar & Sweeteners',
    brand: 'Madhur',
    description: 'Premium refined white sugar, crystal clear, perfect for commercial use',
    price: 2800.00,
    mrp: 3100.00,
    wholesalePrice: 2500.00,
    stock: 45,
    minimumOrderQuantity: 2,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'low_stock',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-20',
    sales: 423,
    rating: 4.5,
    reviews: 87,
    bulkPricing: [
      { minQty: 1, maxQty: 5, price: 2800.00, discount: 0 },
      { minQty: 6, maxQty: 10, price: 2650.00, discount: 5 },
      { minQty: 11, maxQty: 20, price: 2500.00, discount: 11 },
      { minQty: 21, maxQty: null, price: 2350.00, discount: 16 }
    ],
    tags: ['bulk', 'commercial']
  },
  {
    id: 'PRD006',
    name: 'Red Chilli Powder 1kg',
    category: 'Spices',
    brand: 'MDH',
    description: 'Premium quality red chilli powder, Guntur variety, spicy and aromatic',
    price: 280.00,
    mrp: 320.00,
    wholesalePrice: 250.00,
    stock: 280,
    minimumOrderQuantity: 15,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-22',
    sales: 892,
    rating: 4.8,
    reviews: 234,
    bulkPricing: [
      { minQty: 1, maxQty: 30, price: 280.00, discount: 0 },
      { minQty: 31, maxQty: 60, price: 265.00, discount: 5 },
      { minQty: 61, maxQty: 100, price: 250.00, discount: 11 },
      { minQty: 101, maxQty: null, price: 235.00, discount: 16 }
    ],
    tags: ['spicy', 'aromatic', 'guntur']
  },
  {
    id: 'PRD007',
    name: 'Turmeric Powder 500g',
    category: 'Spices',
    brand: 'Everest',
    description: 'High curcumin content turmeric powder, Salem variety, anti-inflammatory',
    price: 180.00,
    mrp: 210.00,
    wholesalePrice: 160.00,
    stock: 340,
    minimumOrderQuantity: 20,
    unit: 'g',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-25',
    sales: 678,
    rating: 4.7,
    reviews: 145,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 180.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 170.00, discount: 6 },
      { minQty: 101, maxQty: 200, price: 160.00, discount: 11 },
      { minQty: 201, maxQty: null, price: 150.00, discount: 17 }
    ],
    tags: ['anti-inflammatory', 'high-curcumin']
  },
  {
    id: 'PRD008',
    name: 'Tea Powder Premium 1kg',
    category: 'Beverages',
    brand: 'Tata Tea',
    description: 'Assam tea leaves, strong aroma, premium blend, perfect for chai',
    price: 450.00,
    mrp: 500.00,
    wholesalePrice: 400.00,
    stock: 0,
    minimumOrderQuantity: 10,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'out_of_stock',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-01-28',
    sales: 567,
    rating: 4.6,
    reviews: 123,
    bulkPricing: [
      { minQty: 1, maxQty: 25, price: 450.00, discount: 0 },
      { minQty: 26, maxQty: 50, price: 425.00, discount: 6 },
      { minQty: 51, maxQty: 100, price: 400.00, discount: 11 },
      { minQty: 101, maxQty: null, price: 375.00, discount: 17 }
    ],
    tags: ['premium', 'assam', 'strong']
  },
  {
    id: 'PRD009',
    name: 'Urad Dal (Black Gram)',
    category: 'Pulses & Dal',
    brand: 'Tata Sampann',
    description: 'Premium quality urad dal, whole and split available, rich in protein',
    price: 135.00,
    mrp: 150.00,
    wholesalePrice: 120.00,
    stock: 265,
    minimumOrderQuantity: 20,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-01',
    sales: 745,
    rating: 4.7,
    reviews: 167,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 135.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 127.00, discount: 6 },
      { minQty: 101, maxQty: 200, price: 120.00, discount: 11 },
      { minQty: 201, maxQty: null, price: 112.00, discount: 17 }
    ],
    tags: ['protein-rich', 'versatile']
  },
  {
    id: 'PRD010',
    name: 'Mustard Oil 5L',
    category: 'Cooking Oil',
    brand: 'Fortune',
    description: 'Cold pressed mustard oil, traditional extraction, authentic flavor',
    price: 520.00,
    mrp: 580.00,
    wholesalePrice: 460.00,
    stock: 155,
    minimumOrderQuantity: 10,
    unit: 'litre',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-05',
    sales: 432,
    rating: 4.5,
    reviews: 98,
    bulkPricing: [
      { minQty: 1, maxQty: 20, price: 520.00, discount: 0 },
      { minQty: 21, maxQty: 50, price: 490.00, discount: 6 },
      { minQty: 51, maxQty: 100, price: 460.00, discount: 12 },
      { minQty: 101, maxQty: null, price: 430.00, discount: 17 }
    ],
    tags: ['traditional', 'cold-pressed']
  },
  {
    id: 'PRD011',
    name: 'Moong Dal (Green Gram)',
    category: 'Pulses & Dal',
    brand: 'Tata Sampann',
    description: 'Premium quality moong dal, easy to digest, light and healthy',
    price: 115.00,
    mrp: 130.00,
    wholesalePrice: 100.00,
    stock: 380,
    minimumOrderQuantity: 25,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-10',
    sales: 856,
    rating: 4.8,
    reviews: 212,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 115.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 107.00, discount: 7 },
      { minQty: 101, maxQty: 200, price: 100.00, discount: 13 },
      { minQty: 201, maxQty: null, price: 93.00, discount: 19 }
    ],
    tags: ['light', 'easy-digest', 'bestseller']
  },
  {
    id: 'PRD012',
    name: 'Besan (Gram Flour) 10kg',
    category: 'Flour & Atta',
    brand: 'Aashirvaad',
    description: 'Fine gram flour, made from premium chana dal, perfect for pakoras',
    price: 380.00,
    mrp: 420.00,
    wholesalePrice: 340.00,
    stock: 125,
    minimumOrderQuantity: 10,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-15',
    sales: 523,
    rating: 4.6,
    reviews: 134,
    bulkPricing: [
      { minQty: 1, maxQty: 20, price: 380.00, discount: 0 },
      { minQty: 21, maxQty: 40, price: 360.00, discount: 5 },
      { minQty: 41, maxQty: 80, price: 340.00, discount: 11 },
      { minQty: 81, maxQty: null, price: 320.00, discount: 16 }
    ],
    tags: ['fine', 'versatile']
  },
  {
    id: 'PRD013',
    name: 'Cumin Seeds (Jeera) 500g',
    category: 'Spices',
    brand: 'MDH',
    description: 'Premium cumin seeds, strong aroma, Gujarat variety, essential spice',
    price: 320.00,
    mrp: 360.00,
    wholesalePrice: 280.00,
    stock: 195,
    minimumOrderQuantity: 15,
    unit: 'g',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-18',
    sales: 389,
    rating: 4.7,
    reviews: 89,
    bulkPricing: [
      { minQty: 1, maxQty: 30, price: 320.00, discount: 0 },
      { minQty: 31, maxQty: 60, price: 300.00, discount: 6 },
      { minQty: 61, maxQty: 100, price: 280.00, discount: 13 },
      { minQty: 101, maxQty: null, price: 260.00, discount: 19 }
    ],
    tags: ['aromatic', 'essential']
  },
  {
    id: 'PRD014',
    name: 'Coriander Seeds 500g',
    category: 'Spices',
    brand: 'Everest',
    description: 'Premium coriander seeds, aromatic and fresh, essential for Indian cooking',
    price: 180.00,
    mrp: 210.00,
    wholesalePrice: 160.00,
    stock: 245,
    minimumOrderQuantity: 15,
    unit: 'g',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-20',
    sales: 467,
    rating: 4.5,
    reviews: 112,
    bulkPricing: [
      { minQty: 1, maxQty: 30, price: 180.00, discount: 0 },
      { minQty: 31, maxQty: 60, price: 170.00, discount: 6 },
      { minQty: 61, maxQty: 100, price: 160.00, discount: 11 },
      { minQty: 101, maxQty: null, price: 150.00, discount: 17 }
    ],
    tags: ['aromatic', 'fresh']
  },
  {
    id: 'PRD015',
    name: 'Groundnut Oil 5L',
    category: 'Cooking Oil',
    brand: 'Fortune',
    description: 'Cold pressed groundnut oil, traditional flavor, perfect for frying',
    price: 580.00,
    mrp: 650.00,
    wholesalePrice: 520.00,
    stock: 85,
    minimumOrderQuantity: 10,
    unit: 'litre',
    area: 'Hyderabad East',
    status: 'low_stock',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-02-25',
    sales: 345,
    rating: 4.6,
    reviews: 78,
    bulkPricing: [
      { minQty: 1, maxQty: 20, price: 580.00, discount: 0 },
      { minQty: 21, maxQty: 50, price: 550.00, discount: 5 },
      { minQty: 51, maxQty: 100, price: 520.00, discount: 10 },
      { minQty: 101, maxQty: null, price: 490.00, discount: 16 }
    ],
    tags: ['traditional', 'frying']
  },
  {
    id: 'PRD016',
    name: 'Chana Dal (Bengal Gram)',
    category: 'Pulses & Dal',
    brand: 'Tata Sampann',
    description: 'Premium quality chana dal, high protein, perfect for curries',
    price: 95.00,
    mrp: 110.00,
    wholesalePrice: 85.00,
    stock: 420,
    minimumOrderQuantity: 25,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-03-01',
    sales: 923,
    rating: 4.8,
    reviews: 245,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 95.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 90.00, discount: 5 },
      { minQty: 101, maxQty: 200, price: 85.00, discount: 11 },
      { minQty: 201, maxQty: null, price: 80.00, discount: 16 }
    ],
    tags: ['protein-rich', 'bestseller']
  },
  {
    id: 'PRD017',
    name: 'Maida (Refined Flour) 25kg',
    category: 'Flour & Atta',
    brand: 'Aashirvaad',
    description: 'Premium refined flour, perfect for bakery and sweets',
    price: 720.00,
    mrp: 800.00,
    wholesalePrice: 640.00,
    stock: 75,
    minimumOrderQuantity: 5,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-03-05',
    sales: 456,
    rating: 4.5,
    reviews: 98,
    bulkPricing: [
      { minQty: 1, maxQty: 10, price: 720.00, discount: 0 },
      { minQty: 11, maxQty: 25, price: 680.00, discount: 6 },
      { minQty: 26, maxQty: 50, price: 640.00, discount: 11 },
      { minQty: 51, maxQty: null, price: 600.00, discount: 17 }
    ],
    tags: ['bakery', 'refined']
  },
  {
    id: 'PRD018',
    name: 'Garam Masala 200g',
    category: 'Spices',
    brand: 'MDH',
    description: 'Premium garam masala blend, aromatic spices, authentic taste',
    price: 145.00,
    mrp: 165.00,
    wholesalePrice: 130.00,
    stock: 310,
    minimumOrderQuantity: 20,
    unit: 'g',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-03-10',
    sales: 678,
    rating: 4.7,
    reviews: 178,
    bulkPricing: [
      { minQty: 1, maxQty: 50, price: 145.00, discount: 0 },
      { minQty: 51, maxQty: 100, price: 137.00, discount: 6 },
      { minQty: 101, maxQty: 200, price: 130.00, discount: 10 },
      { minQty: 201, maxQty: null, price: 122.00, discount: 16 }
    ],
    tags: ['aromatic', 'blend', 'authentic']
  },
  {
    id: 'PRD019',
    name: 'Jaggery (Gur) 5kg',
    category: 'Sugar & Sweeteners',
    brand: 'Madhur',
    description: 'Natural jaggery, rich in iron and minerals, healthy alternative',
    price: 350.00,
    mrp: 400.00,
    wholesalePrice: 310.00,
    stock: 165,
    minimumOrderQuantity: 10,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-03-15',
    sales: 389,
    rating: 4.6,
    reviews: 92,
    bulkPricing: [
      { minQty: 1, maxQty: 20, price: 350.00, discount: 0 },
      { minQty: 21, maxQty: 40, price: 330.00, discount: 6 },
      { minQty: 41, maxQty: 80, price: 310.00, discount: 11 },
      { minQty: 81, maxQty: null, price: 290.00, discount: 17 }
    ],
    tags: ['natural', 'healthy', 'iron-rich']
  },
  {
    id: 'PRD020',
    name: 'Rice Basmati 10kg',
    category: 'Grains & Rice',
    brand: 'India Gate',
    description: 'Extra long grain basmati rice, aged for 1 year, premium quality',
    price: 850.00,
    mrp: 950.00,
    wholesalePrice: 750.00,
    stock: 0,
    minimumOrderQuantity: 5,
    unit: 'kg',
    area: 'Hyderabad East',
    status: 'out_of_stock',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    ],
    createdDate: '2024-03-20',
    sales: 567,
    rating: 4.8,
    reviews: 134,
    bulkPricing: [
      { minQty: 1, maxQty: 10, price: 850.00, discount: 0 },
      { minQty: 11, maxQty: 25, price: 800.00, discount: 6 },
      { minQty: 26, maxQty: 50, price: 750.00, discount: 12 },
      { minQty: 51, maxQty: null, price: 700.00, discount: 18 }
    ],
    tags: ['premium', 'aged', 'extra-long']
  }
];
