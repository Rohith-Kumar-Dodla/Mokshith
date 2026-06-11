import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Custom render function with providers
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        // Add your reducers here
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Render with memory router for route testing
export function renderWithRouter(ui, { route = '/', routes: routeConfig = [] } = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        {routeConfig.length > 0 ? (
          <Routes>
            {routeConfig.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        ) : (
          children
        )}
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

// Mock user data
export const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  businessName: 'Test Business',
};

// Mock cart data
export const mockCart = [
  {
    id: '1',
    name: 'Sona Masoori Rice',
    price: 1150,
    quantity: 10,
    unit: '25kg Bag',
  },
  {
    id: '2',
    name: 'Toor Dal Premium',
    price: 145,
    quantity: 50,
    unit: '1kg Pouch',
  },
];

// Mock product data
export const mockProducts = [
  {
    id: '1',
    name: 'Sona Masoori Rice',
    price: '₹1,150',
    unit: '25kg Bag',
    minQty: 10,
    category: 'Rice & Grains',
    emoji: '🍚',
    badge: 'Best Seller',
  },
  {
    id: '2',
    name: 'Toor Dal Premium',
    price: '₹145',
    unit: '1kg Pouch',
    minQty: 50,
    category: 'Pulses & Dals',
    emoji: '🫘',
    badge: 'Popular',
  },
];

// Mock category data
export const mockCategories = [
  {
    name: 'Rice & Grains',
    slug: 'rice-grains',
    count: 150,
    color: '#f59e0b',
    bgGradient: 'from-amber-50 to-orange-50',
  },
  {
    name: 'Pulses & Dals',
    slug: 'pulses-dals',
    count: 120,
    color: '#8b5cf6',
    bgGradient: 'from-purple-50 to-violet-50',
  },
];

// Mock order tracking data
export const mockTrackingData = {
  orderId: 'ME1234567890',
  status: 'In Transit',
  stages: [
    { label: 'Order Confirmed', time: '10:30 AM', status: 'completed' },
    { label: 'Packed', time: '11:45 AM', status: 'completed' },
    { label: 'Shipped', time: '2:00 PM', status: 'active' },
    { label: 'Out for Delivery', time: 'Expected: Tomorrow', status: 'pending' },
  ],
};

// Mock checkout data
export const mockCheckoutData = {
  items: [
    { name: 'Sona Masoori Rice', qty: '10 × 25kg', price: '₹11,500', emoji: '🍚' },
    { name: 'Sunflower Oil', qty: '5 × 15L', price: '₹8,850', emoji: '🧴' },
  ],
  subtotal: '₹20,350',
  gst: '₹1,018',
  total: '₹21,368',
};

// Wait for async operations
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
