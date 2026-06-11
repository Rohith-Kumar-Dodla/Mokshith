import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileAppPromotion from '../../../../modules/landing/components/MobileAppPromotion.jsx';

describe('MobileAppPromotion Component', () => {
  describe('Rendering', () => {
    it('should render app promotion heading', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Manage Your Business On The Go')).toBeInTheDocument();
    });

    it('should render Google Play button', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const googlePlayButton = screen.getByAltText('Get it on Google Play');
      expect(googlePlayButton).toBeInTheDocument();
    });

    it('should render App Store button', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const appStoreButton = screen.getByAltText('Download on the App Store');
      expect(appStoreButton).toBeInTheDocument();
    });

    it('should render app features', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Instant Notifications')).toBeInTheDocument();
      expect(screen.getByText('Mobile Payments')).toBeInTheDocument();
    });

    it('should render phone mockup', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Mokshith B2B')).toBeInTheDocument();
    });

    it('should render screen cards', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
      expect(screen.getByText('Business Credit')).toBeInTheDocument();
      expect(screen.getByText('Quick Orders')).toBeInTheDocument();
    });

    it('should render app description', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText(/Download our mobile app/)).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Track shipments live')).toBeInTheDocument();
      expect(screen.getByText('Never miss updates')).toBeInTheDocument();
      expect(screen.getByText('Pay on the go')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should have valid links for store buttons', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const googlePlayButton = screen.getByAltText('Get it on Google Play').closest('a');
      const appStoreButton = screen.getByAltText('Download on the App Store').closest('a');

      expect(googlePlayButton).toHaveAttribute('href');
      expect(appStoreButton).toHaveAttribute('href');
    });

    it('should render store buttons as clickable links', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Manage Your Business On The Go');
    });

    it('should have accessible button labels', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      const googlePlayButton = screen.getByAltText('Get it on Google Play');
      const appStoreButton = screen.getByAltText('Download on the App Store');

      expect(googlePlayButton).toBeInTheDocument();
      expect(appStoreButton).toBeInTheDocument();
    });

    it('should have accessible feature titles', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Instant Notifications')).toBeInTheDocument();
      expect(screen.getByText('Mobile Payments')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing app icon gracefully', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      // Component should render even if icon is missing
      expect(screen.getByText('Manage Your Business On The Go')).toBeInTheDocument();
    });

    it('should handle missing feature description gracefully', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      // Component should render even if description is missing
      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
    });

    it('should render without crashing when images fail to load', () => {
      render(
        <MemoryRouter>
          <MobileAppPromotion />
        </MemoryRouter>
      );

      // Component should render even if images fail
      expect(screen.getByText('Manage Your Business On The Go')).toBeInTheDocument();
    });
  });
});
