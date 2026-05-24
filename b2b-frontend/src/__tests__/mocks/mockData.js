import { vi } from 'vitest';

/**
 * Mock data for authentication
 */
export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'B2B_CUSTOMER',
  phone: '1234567890',
  companyName: 'Test Company',
  isVerified: true,
};

export const mockAdmin = {
  id: 'admin-123',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  phone: '1234567890',
  isVerified: true,
};

export const mockSuperAdmin = {
  id: 'superadmin-123',
  name: 'Super Admin',
  email: 'superadmin@example.com',
  role: 'SUPER_ADMIN',
  phone: '1234567890',
  isVerified: true,
};

export const mockAuthToken = 'mock-jwt-token-12345';

/**
 * Mock data for products
 */
export const mockProduct = {
  id: 'prod-123',
  name: 'Test Product',
  description: 'Test product description',
  price: 1000,
  moq: 10,
  category: 'Electronics',
  stock: 100,
  images: ['/test-image.jpg'],
  vendor: {
    id: 'vendor-123',
    name: 'Test Vendor',
  },
};

export const mockProducts = [
  mockProduct,
  {
    id: 'prod-456',
    name: 'Test Product 2',
    description: 'Another test product',
    price: 2000,
    moq: 5,
    category: 'Furniture',
    stock: 50,
    images: ['/test-image2.jpg'],
  },
];

/**
 * Mock data for orders
 */
export const mockOrder = {
  id: 'order-123',
  orderNumber: 'ORD-2024-001',
  user: mockUser,
  items: [
    {
      product: mockProduct,
      quantity: 20,
      price: 1000,
      total: 20000,
    },
  ],
  totalAmount: 20000,
  status: 'PENDING',
  paymentStatus: 'PENDING',
  createdAt: new Date('2024-01-01'),
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
  },
};

export const mockOrders = [mockOrder];

/**
 * Mock data for cart
 */
export const mockCartItem = {
  productId: mockProduct.id,
  product: mockProduct,
  quantity: 10,
};

export const mockCart = {
  items: [mockCartItem],
  total: 10000,
};

/**
 * Mock data for credit
 */
export const mockCredit = {
  id: 'credit-123',
  userId: mockUser.id,
  creditLimit: 100000,
  usedCredit: 30000,
  availableCredit: 70000,
  status: 'ACTIVE',
};

/**
 * Mock API responses
 */
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

export const mockApiError = (message = 'API Error', status = 400) => ({
  response: {
    data: { message },
    status,
    statusText: 'Bad Request',
  },
  message,
});

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const storage = {};
  return {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

/**
 * Mock axios
 */
export const createMockAxios = () => {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  };
};

/**
 * Mock React Router hooks
 */
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};
export const mockParams = {};

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Mock WebSocket
 */
export const createMockSocket = () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
});

/**
 * Mock file upload
 */
export const createMockFile = (
  name = 'test.jpg',
  size = 1024,
  type = 'image/jpeg'
) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/**
 * Mock intersection observer entries
 */
export const createMockIntersectionObserverEntry = (
  isIntersecting = true
) => ({
  isIntersecting,
  target: document.createElement('div'),
  intersectionRatio: isIntersecting ? 1 : 0,
  boundingClientRect: {},
  intersectionRect: {},
  rootBounds: {},
  time: Date.now(),
});

/**
 * Create mock Redux state
 */
export const createMockState = (overrides = {}) => ({
  auth: {
    user: mockUser,
    token: mockAuthToken,
    isAuthenticated: true,
    loading: false,
    error: null,
  },
  product: {
    products: mockProducts,
    selectedProduct: null,
    loading: false,
    error: null,
  },
  order: {
    orders: mockOrders,
    cart: mockCart.items,
    loading: false,
    error: null,
  },
  admin: {
    stats: {},
    users: [],
    loading: false,
    error: null,
  },
  superAdmin: {
    config: {},
    metrics: {},
    loading: false,
    error: null,
  },
  ...overrides,
});

/**
 * Mock form event
 */
export const createMockEvent = (name, value) => ({
  target: { name, value },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

/**
 * Delay helper for async tests
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
