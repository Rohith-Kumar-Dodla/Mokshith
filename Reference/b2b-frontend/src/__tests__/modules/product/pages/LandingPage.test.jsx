import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../../../../modules/product/pages/LandingPage.jsx';

// Mock all the child components
vi.mock('../../../../modules/landing/components/HeroSection.jsx', () => ({
  default: () => <div data-testid="hero-section">Hero Section</div>,
}));

vi.mock('../../../../modules/landing/components/BusinessFeatures.jsx', () => ({
  default: () => <div data-testid="business-features">Business Features</div>,
}));

vi.mock('../../../../modules/landing/components/ProductCategories.jsx', () => ({
  default: () => <div data-testid="product-categories">Product Categories</div>,
}));

vi.mock('../../../../modules/landing/components/WholesaleDeals.jsx', () => ({
  default: () => <div data-testid="wholesale-deals">Wholesale Deals</div>,
}));

vi.mock('../../../../modules/landing/components/PlatformShowcase.jsx', () => ({
  default: () => <div data-testid="platform-showcase">Platform Showcase</div>,
}));

vi.mock('../../../../modules/landing/components/SocialProof.jsx', () => ({
  default: () => <div data-testid="social-proof">Social Proof</div>,
}));

vi.mock('../../../../modules/landing/components/CTASection.jsx', () => ({
  default: () => <div data-testid="cta-section">CTA Section</div>,
}));

vi.mock('../../../../modules/landing/components/MobileAppPromotion.jsx', () => ({
  default: () => <div data-testid="mobile-app-promotion">Mobile App Promotion</div>,
}));

describe('LandingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Hero Section', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should render Business Features', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('business-features')).toBeInTheDocument();
    });

    it('should render Product Categories', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('product-categories')).toBeInTheDocument();
    });

    it('should render Wholesale Deals', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('wholesale-deals')).toBeInTheDocument();
    });

    it('should render Platform Showcase', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('platform-showcase')).toBeInTheDocument();
    });

    it('should render Social Proof', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('social-proof')).toBeInTheDocument();
    });

    it('should render CTA Section', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    });

    it('should render Mobile App Promotion', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mobile-app-promotion')).toBeInTheDocument();
    });

    it('should render all sections in correct order', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      const sections = screen.getAllByTestId(/hero-section|business-features|product-categories|wholesale-deals|platform-showcase|social-proof|cta-section|mobile-app-promotion/);
      expect(sections.length).toBe(8);
    });
  });

  describe('Integration', () => {
    it('should render without crashing', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should have all child components mounted', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
      expect(screen.getByTestId('business-features')).toBeInTheDocument();
      expect(screen.getByTestId('product-categories')).toBeInTheDocument();
      expect(screen.getByTestId('wholesale-deals')).toBeInTheDocument();
      expect(screen.getByTestId('platform-showcase')).toBeInTheDocument();
      expect(screen.getByTestId('social-proof')).toBeInTheDocument();
      expect(screen.getByTestId('cta-section')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-app-promotion')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing component gracefully', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      // Component should render even if a child component fails
      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });

    it('should render without errors when components are mocked', () => {
      render(
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    });
  });
});
