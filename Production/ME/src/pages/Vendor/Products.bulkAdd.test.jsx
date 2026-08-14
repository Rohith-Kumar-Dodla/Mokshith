import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Products from './Products';
import useProducts from '../../hooks/useProducts';
import useCart from '../../hooks/useCart';
import useWishlist from '../../hooks/useWishlist';
import useCategories from '../../hooks/useCategories';

vi.mock('../../hooks/useProducts');
vi.mock('../../hooks/useWishlist');
vi.mock('../../hooks/useCart');
vi.mock('../../hooks/useCategories');

const rice = {
  id: 'p1',
  name: 'Rice 25kg',
  category: 'Grains',
  price: 100,
  minimumOrderQuantity: 5,
  unit: 'bag',
  stock: 99,
  status: 'active',
  image: '/rice.jpg',
  bulkPricing: [{ minQuantity: 10, price: 80 }],
};

const oil = {
  id: 'p2',
  name: 'Oil 15L',
  category: 'Oils',
  price: 200,
  minimumOrderQuantity: 1,
  unit: 'can',
  stock: 40,
  status: 'active',
  image: '/oil.jpg',
};

const flour = {
  id: 'p3',
  name: 'Flour 10kg',
  category: 'Grains',
  price: 50,
  minimumOrderQuantity: 1,
  unit: 'bag',
  stock: 10,
  status: 'active',
  image: '/flour.jpg',
};

function mockHooks({ addToCart = vi.fn().mockResolvedValue({}), products = [rice, oil, flour] } = {}) {
  useCategories.mockReturnValue({ categories: [] });
  useCart.mockReturnValue({ addToCart, actionLoading: false });
  useWishlist.mockReturnValue({ addToWishlist: vi.fn(), actionLoading: false });
  useProducts.mockReturnValue({
    products,
    filteredProducts: products,
    loading: false,
    error: null,
    categoryIdFromUrl: null,
    brands: [],
    handleSearch: vi.fn(),
    handleFilterChange: vi.fn(),
  });
  return { addToCart };
}

function renderProducts() {
  return render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );
}

describe('Vendor Products bulk add to cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides the bulk add button when nothing is selected', () => {
    mockHooks();
    renderProducts();
    expect(screen.queryByRole('button', { name: /Add Selected to Cart/i })).not.toBeInTheDocument();
  });

  it('shows Add Selected to Cart (1) for a single selection', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    expect(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i })).toBeInTheDocument();
  });

  it('shows the correct count for multiple selections', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    expect(screen.getByRole('button', { name: /Add Selected to Cart \(2\)/i })).toBeInTheDocument();
  });

  it('selects all currently visible products', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByRole('button', { name: /Select All/i }));
    expect(screen.getByRole('button', { name: /Add Selected to Cart \(3\)/i })).toBeInTheDocument();
  });

  it('clears the selection', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByRole('button', { name: /Select All/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Clear Selection/i })[0]);
    expect(screen.queryByRole('button', { name: /Add Selected to Cart/i })).not.toBeInTheDocument();
  });

  it('opens a summary modal with exactly the selected products', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(2\)/i }));

    const dialog = screen.getByRole('dialog', { name: /Selected Products/i });
    expect(within(dialog).getByText('Rice 25kg')).toBeInTheDocument();
    expect(within(dialog).getByText('Oil 15L')).toBeInTheDocument();
    expect(within(dialog).queryByText('Flour 10kg')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/2 products selected/i)).toBeInTheDocument();
  });

  it('initializes quantities to MOQ and allows quantity changes', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /Decrease quantity for Rice 25kg/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));
    expect(within(dialog).getByLabelText('Rice 25kg quantity')).toHaveTextContent('6');
  });

  it('shows existing bulk pricing in the summary', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));
    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));
    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));
    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));
    fireEvent.click(screen.getByRole('button', { name: /Increase quantity for Rice 25kg/i }));

    expect(within(dialog).getByText(/Bulk price: ₹80.00\/item/i)).toBeInTheDocument();
    expect(within(dialog).getAllByText('₹800.00').length).toBeGreaterThan(0);
  });

  it('adds selected products, clears selection, and closes the modal', async () => {
    const { addToCart } = mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(2\)/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Add to Cart$/i }));

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledTimes(2);
    });
    expect(addToCart).toHaveBeenCalledWith('p1', 5);
    expect(addToCart).toHaveBeenCalledWith('p2', 1);
    expect(screen.getByText(/2 products added to your cart/i)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Selected to Cart/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Cart/i })).toBeInTheDocument();
  });

  it('reports partial failures without a false all-success message', async () => {
    const addToCart = vi.fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Insufficient stock.'));
    mockHooks({ addToCart });
    renderProducts();

    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByLabelText('Select Flour 10kg'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(2\)/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Add to Cart$/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 product added successfully/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 product could not be added/i)).toBeInTheDocument();
    expect(screen.queryByText(/2 products added to your cart/i)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/Flour 10kg/);
    expect(screen.getByRole('alert')).toHaveTextContent(/Insufficient stock/i);
  });

  it('does not send duplicate requests when Add to Cart is clicked twice', async () => {
    let resolveFirst;
    const addToCart = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveFirst = resolve;
      })
    );
    mockHooks({ addToCart });
    renderProducts();

    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: /^Add to Cart$/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(addToCart).toHaveBeenCalledTimes(1);
    resolveFirst({});
    await waitFor(() => {
      expect(screen.getByText(/1 product added to your cart/i)).toBeInTheDocument();
    });
    expect(addToCart).toHaveBeenCalledTimes(1);
  });

  it('keeps existing authentication error handling', async () => {
    const addToCart = vi.fn().mockRejectedValue(new Error('Your session has expired. Please sign in again.'));
    mockHooks({ addToCart });
    renderProducts();

    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Add to Cart$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Your session has expired. Please sign in again./i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/\d+ products? added to your cart/i)).not.toBeInTheDocument();
  });

  it('closes the summary with Escape and keeps the original selection', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Oil 15L'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i })).toBeInTheDocument();
  });

  it('keeps the summary usable on a stacked mobile layout', () => {
    mockHooks();
    renderProducts();
    fireEvent.click(screen.getByLabelText('Select Rice 25kg'));
    fireEvent.click(screen.getByRole('button', { name: /Add Selected to Cart \(1\)/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('.flex-col')).not.toBeNull();
    expect(within(dialog).getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Close Selected Products/i })).toBeInTheDocument();
  });
});
