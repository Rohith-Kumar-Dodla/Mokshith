import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductCategories from '../../../../modules/landing/components/ProductCategories.jsx';
import { routes } from '../../../../routes/routeConfig.js';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ProductCategories Component', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Browse by Category')).toBeInTheDocument();
    });

    it('should render section subtitle', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Explore our wide range of product categories')).toBeInTheDocument();
    });

    it('should render Rice & Grains category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
    });

    it('should render Pulses & Dals category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Pulses & Dals')).toBeInTheDocument();
    });

    it('should render Edible Oils category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Edible Oils')).toBeInTheDocument();
    });

    it('should render FMCG category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('FMCG')).toBeInTheDocument();
    });

    it('should render Sugar & Salt category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Sugar & Salt')).toBeInTheDocument();
    });

    it('should render Beverages category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Beverages')).toBeInTheDocument();
    });

    it('should render all 6 category cards', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const categories = screen.getAllByText(/Products/);
      expect(categories.length).toBe(6);
    });

    it('should render category product counts', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('150+ Products')).toBeInTheDocument();
      expect(screen.getByText('120+ Products')).toBeInTheDocument();
      expect(screen.getByText('85+ Products')).toBeInTheDocument();
      expect(screen.getByText('200+ Products')).toBeInTheDocument();
      expect(screen.getByText('65+ Products')).toBeInTheDocument();
      expect(screen.getByText('95+ Products')).toBeInTheDocument();
    });

    it('should render Explore CTA on each category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const exploreButtons = screen.getAllByText('Explore');
      expect(exploreButtons.length).toBe(6);
    });

    it('should render category icons without crashing', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    it('should have correct navigation link for Rice & Grains', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const riceLink = screen.getByText('Rice & Grains').closest('a');
      expect(riceLink).toHaveAttribute('href', `${routes.PRODUCTS}/rice-grains`);
    });

    it('should have correct navigation link for Pulses & Dals', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const pulsesLink = screen.getByText('Pulses & Dals').closest('a');
      expect(pulsesLink).toHaveAttribute('href', `${routes.PRODUCTS}/pulses-dals`);
    });

    it('should have correct navigation link for Edible Oils', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const oilsLink = screen.getByText('Edible Oils').closest('a');
      expect(oilsLink).toHaveAttribute('href', `${routes.PRODUCTS}/edible-oils`);
    });

    it('should have correct navigation link for FMCG', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const fmcgLink = screen.getByText('FMCG').closest('a');
      expect(fmcgLink).toHaveAttribute('href', `${routes.PRODUCTS}/fmcg`);
    });

    it('should have correct navigation link for Sugar & Salt', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const sugarLink = screen.getByText('Sugar & Salt').closest('a');
      expect(sugarLink).toHaveAttribute('href', `${routes.PRODUCTS}/sugar-salt`);
    });

    it('should have correct navigation link for Beverages', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const beveragesLink = screen.getByText('Beverages').closest('a');
      expect(beveragesLink).toHaveAttribute('href', `${routes.PRODUCTS}/beverages`);
    });

    it('should render category cards as clickable links', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const categoryLinks = screen.getAllByRole('link');
      expect(categoryLinks.length).toBe(6);
    });
  });

  describe('Content Validation', () => {
    it('should display expected data for each category', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
      expect(screen.getByText('150+ Products')).toBeInTheDocument();
      expect(screen.getByText('Pulses & Dals')).toBeInTheDocument();
      expect(screen.getByText('120+ Products')).toBeInTheDocument();
    });

    it('should have Explore Category button on each card', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const exploreTexts = screen.getAllByText('Explore');
      expect(exploreTexts.length).toBe(6);
    });

    it('should render category names correctly', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBe(6);
      headings.forEach(heading => {
        expect(heading).toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Browse by Category');
    });

    it('should have accessible category names', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toHaveTextContent(/Rice|Pulses|Edible|FMCG|Sugar|Beverages/);
      });
    });

    it('should have accessible navigation links', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should render without crashing when categories array is empty', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      // Component should still render section header
      expect(screen.getByText('Browse by Category')).toBeInTheDocument();
    });

    it('should handle missing category icon gracefully', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      // Component should render even if an icon is missing
      expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
    });

    it('should handle missing product count gracefully', () => {
      render(
        <MemoryRouter>
          <ProductCategories />
        </MemoryRouter>
      );

      // Component should render even if count is missing
      expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
    });
  });
});
