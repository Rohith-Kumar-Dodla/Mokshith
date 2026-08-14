import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorDashboard from './Dashboard';
import Products from './Products';
import useProducts from '../../hooks/useProducts';
import useOrders from '../../hooks/useOrders';
import useWishlist from '../../hooks/useWishlist';
import useVendorAnalytics from '../../hooks/useVendorAnalytics';
import useCart from '../../hooks/useCart';
import useCategories from '../../hooks/useCategories';

vi.mock('../../hooks/useProducts');
vi.mock('../../hooks/useOrders');
vi.mock('../../hooks/useWishlist');
vi.mock('../../hooks/useVendorAnalytics');
vi.mock('../../hooks/useCart');
vi.mock('../../hooks/useCategories');

describe('Vendor Dashboard KPI drill-down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProducts.mockReturnValue({ products: [], loading: false });
    useOrders.mockReturnValue({
      orders: [
        { id: '1', status: 'pending', items: [], amount: 100, orderNumber: 'A1', orderDate: '01 Jun 2026' },
        { id: '2', status: 'processing', items: [], amount: 200, orderNumber: 'A2', orderDate: '02 Jun 2026', estimatedDelivery: 'Processing' },
        { id: '3', status: 'delivered', items: [], amount: 300, orderNumber: 'A3', orderDate: '03 Jun 2026', deliveryDate: '04 Jun 2026' },
      ],
      loading: false,
      error: null,
    });
    useWishlist.mockReturnValue({ itemCount: 4 });
    useVendorAnalytics.mockReturnValue({
      analytics: {
        summary: {
          totalOrders: 3,
          totalSpending: 1000,
          thisMonthSpending: 250,
          availableCredit: 5000,
        },
        topCategories: [],
      },
      loading: false,
      error: null,
    });
  });

  it('links Total Orders and status KPIs to Vendor Orders with filters', async () => {
    render(
      <MemoryRouter>
        <VendorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View Total Orders/i })).toHaveAttribute('href', '/vendor/orders');
    });
    expect(screen.getByRole('link', { name: /View Delivered Orders/i })).toHaveAttribute(
      'href',
      '/vendor/orders?status=delivered'
    );
    expect(screen.getByRole('link', { name: /View Pending Orders/i })).toHaveAttribute(
      'href',
      '/vendor/orders?status=pending'
    );
    expect(screen.getByRole('link', { name: /View Wishlist Products/i })).toHaveAttribute(
      'href',
      '/vendor/wishlist'
    );
  });
});

describe('Vendor Products selection and stock display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCategories.mockReturnValue({ categories: [] });
    useCart.mockReturnValue({
      addToCart: vi.fn().mockResolvedValue({}),
      actionLoading: false,
    });
    useWishlist.mockReturnValue({
      addToWishlist: vi.fn(),
      actionLoading: false,
    });
    useProducts.mockReturnValue({
      products: [
        {
          id: 'p1',
          name: 'Rice 25kg',
          category: 'Grains',
          price: 100,
          minimumOrderQuantity: 5,
          unit: 'bag',
          stock: 99,
          status: 'active',
          image: '/rice.jpg',
        },
        {
          id: 'p2',
          name: 'Oil 15L',
          category: 'Oils',
          price: 200,
          minimumOrderQuantity: 1,
          unit: 'can',
          stock: 40,
          status: 'active',
          image: '/oil.jpg',
        },
      ],
      filteredProducts: [
        {
          id: 'p1',
          name: 'Rice 25kg',
          category: 'Grains',
          price: 100,
          minimumOrderQuantity: 5,
          unit: 'bag',
          stock: 99,
          status: 'active',
          image: '/rice.jpg',
        },
        {
          id: 'p2',
          name: 'Oil 15L',
          category: 'Oils',
          price: 200,
          minimumOrderQuantity: 1,
          unit: 'can',
          stock: 40,
          status: 'active',
          image: '/oil.jpg',
        },
      ],
      loading: false,
      error: null,
      categoryIdFromUrl: null,
      brands: [],
      handleSearch: vi.fn(),
      handleFilterChange: vi.fn(),
    });
  });

  it('hides stock counts and uses a global Add to Cart for selected products', async () => {
    const addToCart = vi.fn().mockResolvedValue({});
    useCart.mockReturnValue({ addToCart, actionLoading: false });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Stock:\s*99/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Stock:\s*40/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Selected to Cart/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Add to Cart$/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));

    expect(screen.getAllByText(/2 products selected/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(2\)/i }));

    expect(screen.getByRole('dialog', { name: /Selected Products/i })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Add to Cart$/i }));

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledTimes(2);
    });
    expect(addToCart).toHaveBeenCalledWith('p1', 5);
    expect(addToCart).toHaveBeenCalledWith('p2', 1);
  });
});
