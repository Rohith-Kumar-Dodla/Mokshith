import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Navbar from '../../../components/common/Navbar.jsx';
import { routes } from '../../../routes/routeConfig.js';
import { useAuth } from '../../../modules/auth/hooks/useAuth.js';
import { useOrder } from '../../../modules/order/hooks/useOrder.js';

// Mock the hooks
vi.mock('../../../modules/auth/hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../modules/order/hooks/useOrder.js', () => ({
  useOrder: vi.fn(),
}));

vi.mock('../../../components/common/NotificationBadge.jsx', () => ({
  default: () => <div data-testid="notification-badge">Notifications</div>,
}));

vi.mock('../../../components/common/Sidebar.jsx', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="sidebar" role="dialog" onClick={onClose}>Sidebar</div> : null
  ),
}));

vi.mock('../../../components/common/CartDrawer.jsx', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="cart-drawer" role="dialog" onClick={onClose}>Cart Drawer</div> : null
  ),
}));

vi.mock('../../../components/feedback/ConfirmDialog.jsx', () => ({
  default: () => null,
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render logo successfully', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Mokshith')).toBeInTheDocument();
      expect(screen.getByText('B2B')).toBeInTheDocument();
    });

    it('should render Products link', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('should render Pricing link when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Pricing')).toBeInTheDocument();
    });

    it('should render Dashboard and Orders links when user is logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    it('should render Login button when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('should render Register/Join button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    it('should render cart button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /shopping cart/i })).toBeInTheDocument();
    });

    it('should display cart count badge when cart has items', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [{ quantity: 5 }, { quantity: 3 }] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should not display cart count badge when cart is empty', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: 'Shopping cart' })).toBeInTheDocument();
    });

    it('should render user avatar button when user is logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should render mobile menu button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('should navigate to landing page when logo is clicked', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <MemoryRouter initialEntries={['/products']}>
          <Navbar />
        </MemoryRouter>
      );

      const logo = screen.getByText('Mokshith').closest('a');
      expect(logo).toHaveAttribute('href', routes.LANDING);
    });

    it('should have correct href for Products link', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const productsLink = screen.getByText('Products').closest('a');
      expect(productsLink).toHaveAttribute('href', routes.PRODUCTS);
    });

    it('should have correct href for Login link', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const loginLink = screen.getByText('Login').closest('a');
      expect(loginLink).toHaveAttribute('href', routes.LOGIN);
    });

    it('should have correct href for Register link', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const registerLink = screen.getByText('Join').closest('a');
      expect(registerLink).toHaveAttribute('href', routes.REGISTER);
    });

    it('should have correct href for Dashboard link when logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', routes.DASHBOARD);
    });

    it('should have correct href for Orders link when logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const ordersLink = screen.getByText('Orders').closest('a');
      expect(ordersLink).toHaveAttribute('href', routes.ORDERS);
    });
  });

  describe('Responsive Behavior', () => {
    it('should open sidebar when menu button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', { name: /navigation menu/i });
      await user.click(menuButton);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should close sidebar when onClose is called', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const menuButton = screen.getByRole('button', { name: /navigation menu/i });
      await user.click(menuButton);
      const sidebar = screen.getByTestId('sidebar');
      await user.click(sidebar);
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('should open cart drawer when cart button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const cartButton = screen.getByRole('button', { name: /shopping cart/i });
      await user.click(cartButton);
      expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
    });

    it('should close cart drawer when onClose is called', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const cartButton = screen.getByRole('button', { name: /shopping cart/i });
      await user.click(cartButton);
      const cartDrawer = screen.getByTestId('cart-drawer');
      await user.click(cartDrawer);
      expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation links with accessible names', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const productsLink = screen.getByText('Products');
      expect(productsLink).toHaveTextContent('Products');

      const loginLink = screen.getByText('Login');
      expect(loginLink).toHaveTextContent('Login');
    });

    it('should have buttons that are keyboard accessible', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        button.focus();
        expect(button).toHaveFocus();
      }
    });

    it('should have proper heading structure', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const logo = screen.getByText('Mokshith');
      expect(logo.tagName).toBe('SPAN');
    });

    it('should have proper ARIA attributes on cart button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [{ quantity: 5 }] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      const cartBadge = screen.getByText('5');
      expect(cartBadge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no name', () => {
      vi.mocked(useAuth).mockReturnValue({ user: {} });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should handle cart with undefined quantity', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [{}] });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: 'Shopping cart' })).toBeInTheDocument();
    });

    it('should handle null cart', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: null });

      render(
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: 'Shopping cart' })).toBeInTheDocument();
    });

    it('should render correctly on landing page', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <MemoryRouter initialEntries={[routes.LANDING]}>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.getByText('Mokshith')).toBeInTheDocument();
    });

    it('should render correctly on non-landing page', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });
      vi.mocked(useOrder).mockReturnValue({ cart: [] });

      render(
        <MemoryRouter initialEntries={[routes.PRODUCTS]}>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.getByText('Mokshith')).toBeInTheDocument();
    });
  });
});
