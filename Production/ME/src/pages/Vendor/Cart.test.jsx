import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Cart from './Cart';
import useCart from '../../hooks/useCart';

vi.mock('../../hooks/useCart');

const mockCartItem = {
  id: 'prod-1',
  productId: 'prod-1',
  productName: 'Basmati Rice',
  productImage: 'https://example.com/rice.jpg',
  category: 'Grains',
  quantity: 30,
  unitPrice: 100,
  bulkPrice: 90,
  subtotal: 2700,
  minimumOrderQuantity: 10,
  availableStock: 50,
  status: 'active',
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );

describe('Cart page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    useCart.mockReturnValue({
      loading: true,
      actionLoading: false,
      error: null,
      cartItems: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      removeFromCart: vi.fn(),
      loadCart: vi.fn(),
    });

    renderCart();

    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    useCart.mockReturnValue({
      loading: false,
      actionLoading: false,
      error: null,
      cartItems: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      removeFromCart: vi.fn(),
      loadCart: vi.fn(),
    });

    renderCart();

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Products' })).toBeInTheDocument();
  });

  it('renders populated cart with totals', () => {
    useCart.mockReturnValue({
      loading: false,
      actionLoading: false,
      error: null,
      cartItems: [mockCartItem],
      subtotal: 2700,
      discount: 300,
      tax: 486,
      grandTotal: 3186,
      removeFromCart: vi.fn(),
      loadCart: vi.fn(),
    });

    renderCart();

    expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getAllByText('₹2700.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Grand Total').closest('div')?.textContent).toContain('₹3186.00');
    expect(screen.getByText('Quantity changes not yet supported')).toBeInTheDocument();
  });

  it('calls removeFromCart when remove button is clicked', async () => {
    const removeFromCart = vi.fn().mockResolvedValue({});
    useCart.mockReturnValue({
      loading: false,
      actionLoading: false,
      error: null,
      cartItems: [mockCartItem],
      subtotal: 2700,
      discount: 300,
      tax: 486,
      grandTotal: 3186,
      removeFromCart,
      loadCart: vi.fn(),
    });

    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByTitle('Remove from Cart'));

    await waitFor(() => {
      expect(removeFromCart).toHaveBeenCalledWith('prod-1');
    });
  });

  it('renders error state when cart fails to load', () => {
    const loadCart = vi.fn();
    useCart.mockReturnValue({
      loading: false,
      actionLoading: false,
      error: 'Unauthorized',
      cartItems: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      removeFromCart: vi.fn(),
      loadCart,
    });

    renderCart();

    expect(screen.getByText('Failed to load cart')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
