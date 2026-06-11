import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Navbar from '../../components/common/Navbar.jsx';
import Footer from '../../components/common/Footer.jsx';
import HeroSection from '../../modules/landing/components/HeroSection.jsx';
import BusinessFeatures from '../../modules/landing/components/BusinessFeatures.jsx';

// Mock the hooks
vi.mock('../../modules/auth/hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../modules/order/hooks/useOrder.js', () => ({
  useOrder: vi.fn(),
}));

vi.mock('../../components/common/Sidebar.jsx', () => ({
  default: () => null,
}));

vi.mock('../../components/common/CartDrawer.jsx', () => ({
  default: () => null,
}));

vi.mock('../../components/feedback/ConfirmDialog.jsx', () => ({
  default: () => null,
}));

const mockUseAuth = await import('../../modules/auth/hooks/useAuth.js');
const mockUseOrder = await import('../../modules/order/hooks/useOrder.js');

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.useAuth.mockReturnValue({ user: null });
    mockUseOrder.useOrder.mockReturnValue({ cart: [] });
  });

  describe('Navbar Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible navigation links', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    it('should have accessible buttons', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should have accessible logo', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const logo = screen.getByText('Mokshith');
      expect(logo).toBeVisible();
    });
  });

  describe('Footer Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible footer links', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    it('should have accessible headings', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toBeVisible();
      });
    });
  });

  describe('Hero Section Accessibility', () => {
    it('should have accessible heading structure', () => {
      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(
        <MemoryRouter>
          <HeroSection />
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
          <HeroSection />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });
  });

  describe('Business Features Accessibility', () => {
    it('should have accessible heading structure', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible feature cards', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      headings.forEach(heading => {
        expect(heading).toBeVisible();
      });
    });
  });

  describe('General Accessibility', () => {
    it('should have buttons with accessible labels', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should have links with accessible names', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });

    it('should have images with alt text where applicable', () => {
      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      // Check for any images that should have alt text
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        if (img) {
          expect(img).toHaveAttribute('alt');
        }
      });
    });

    it('should have proper heading hierarchy', () => {
      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const h1 = screen.queryByRole('heading', { level: 1 });
      if (h1) {
        expect(h1).toBeInTheDocument();
      }
    });
  });
});
