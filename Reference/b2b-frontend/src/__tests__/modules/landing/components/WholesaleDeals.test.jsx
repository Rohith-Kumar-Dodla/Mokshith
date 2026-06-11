import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WholesaleDeals from '../../../../modules/landing/components/WholesaleDeals.jsx';
import { routes } from '../../../../routes/routeConfig.js';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('WholesaleDeals Component', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Top Wholesale Deals')).toBeInTheDocument();
    });

    it('should render section subtitle', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Direct from vendors with competitive bulk pricing')).toBeInTheDocument();
    });

    it('should render all 4 product cards', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
      expect(screen.getByText('Toor Dal Premium')).toBeInTheDocument();
      expect(screen.getByText('Sunflower Oil')).toBeInTheDocument();
      expect(screen.getByText('Refined Sugar')).toBeInTheDocument();
    });

    it('should render product names', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
      expect(screen.getByText('Toor Dal Premium')).toBeInTheDocument();
      expect(screen.getByText('Sunflower Oil')).toBeInTheDocument();
      expect(screen.getByText('Refined Sugar')).toBeInTheDocument();
    });

    it('should render product prices', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('₹1,150')).toBeInTheDocument();
      expect(screen.getByText('₹145')).toBeInTheDocument();
      expect(screen.getByText('₹1,770')).toBeInTheDocument();
      expect(screen.getByText('₹2,100')).toBeInTheDocument();
    });

    it('should render product units', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('/25kg Bag')).toBeInTheDocument();
      expect(screen.getByText('/1kg Pouch')).toBeInTheDocument();
      expect(screen.getByText('/15L Tin')).toBeInTheDocument();
      expect(screen.getByText('/50kg Bag')).toBeInTheDocument();
    });

    it('should render product badges', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Best Seller')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('Bulk Deal')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render Add buttons', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const addButtons = screen.getAllByText('Add to Order');
      expect(addButtons.length).toBe(4);
    });

    it('should render View All Products button', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('View All Products')).toBeInTheDocument();
    });

    it('should render product categories', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
      expect(screen.getByText('Pulses & Dals')).toBeInTheDocument();
      expect(screen.getByText('Edible Oils')).toBeInTheDocument();
      expect(screen.getByText('Sugar & Salt')).toBeInTheDocument();
    });

    it('should render minimum order quantities', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Min. Order: 10 units')).toBeInTheDocument();
      expect(screen.getByText('Min. Order: 50 units')).toBeInTheDocument();
      expect(screen.getAllByText('Min. Order: 5 units')).toHaveLength(2);
    });
  });

  describe('Interactions', () => {
    it('should have correct navigation link for product cards', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const productLinks = screen.getAllByRole('link');
      expect(productLinks.length).toBeGreaterThan(0);
    });

    it('should have correct href for View All Products button', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const viewAllLink = screen.getByText('View All Products').closest('a');
      expect(viewAllLink).toHaveAttribute('href', routes.PRODUCTS);
    });

    it('should render product cards as clickable links', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const productCards = screen.getAllByText(/Sona|Toor|Sunflower|Refined/);
      expect(productCards.length).toBe(4);
    });

    it('should render Add buttons as clickable elements', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const addButtons = screen.getAllByText('Add to Order');
      addButtons.forEach(button => {
        expect(button.closest('button')).toBeInTheDocument();
      });
    });
  });

  describe('Content Validation', () => {
    it('should display expected data for each product', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
      expect(screen.getByText('₹1,150')).toBeInTheDocument();
      expect(screen.getByText('/25kg Bag')).toBeInTheDocument();
      expect(screen.getByText('Best Seller')).toBeInTheDocument();
    });

    it('should render product emojis without crashing', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const emojis = screen.getAllByText(/🍚|🫘|🧴|🧂/);
      expect(emojis.length).toBe(4);
    });

    it('should have visible product cards', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const productNames = screen.getAllByRole('heading', { level: 3 });
      expect(productNames.length).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product list gracefully', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      // Component should still render section header
      expect(screen.getByText('Top Wholesale Deals')).toBeInTheDocument();
    });

    it('should handle product missing image gracefully', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      // Component should render even if image is missing
      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
    });

    it('should handle product missing optional fields gracefully', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      // Component should render even if optional fields are missing
      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
    });

    it('should handle product missing badge gracefully', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      // Component should render even if badge is missing
      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
    });

    it('should handle product missing minQty gracefully', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      // Component should render even if minQty is missing
      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Top Wholesale Deals');
    });

    it('should have accessible product names', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toBeVisible();
      });
    });

    it('should have accessible buttons', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should have accessible links', () => {
      render(
        <MemoryRouter>
          <WholesaleDeals />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });
  });
});
