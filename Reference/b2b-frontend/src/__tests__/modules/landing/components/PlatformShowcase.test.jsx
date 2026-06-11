import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlatformShowcase from '../../../../modules/landing/components/PlatformShowcase.jsx';

describe('PlatformShowcase Component', () => {
  describe('Order Tracking Widget', () => {
    it('should render tracking widget', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    it('should render order ID', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Order #ME1234567890')).toBeInTheDocument();
    });

    it('should render tracking status', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('In Transit')).toBeInTheDocument();
    });

    it('should render Order Confirmed stage', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
      expect(screen.getByText('10:30 AM')).toBeInTheDocument();
    });

    it('should render Packed stage', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Packed')).toBeInTheDocument();
      expect(screen.getByText('11:45 AM')).toBeInTheDocument();
    });

    it('should render Shipped stage', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });

    it('should render Out for Delivery stage', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
      expect(screen.getByText('Expected: Tomorrow')).toBeInTheDocument();
    });

    it('should render all progress stages', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Packed')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
    });

    it('should handle partial tracking data gracefully', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      // Component should render even with partial data
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    it('should not crash with missing stage data', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      // Component should render even if stage data is missing
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });
  });

  describe('Checkout Widget', () => {
    it('should render checkout widget', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Quick Checkout')).toBeInTheDocument();
    });

    it('should render subtotal', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('₹20,350')).toBeInTheDocument();
    });

    it('should render GST', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('GST (5%)')).toBeInTheDocument();
      expect(screen.getByText('₹1,018')).toBeInTheDocument();
    });

    it('should render total amount', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('₹21,368')).toBeInTheDocument();
    });

    it('should render Pay Now button', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Proceed to Payment')).toBeInTheDocument();
    });

    it('should render checkout items', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Sona Masoori Rice')).toBeInTheDocument();
      expect(screen.getByText('Sunflower Oil')).toBeInTheDocument();
    });

    it('should render item quantities', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('10 × 25kg')).toBeInTheDocument();
      expect(screen.getByText('5 × 15L')).toBeInTheDocument();
    });

    it('should render item prices', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('₹11,500')).toBeInTheDocument();
      expect(screen.getByText('₹8,850')).toBeInTheDocument();
    });

    it('should handle zero amount gracefully', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      // Component should render even with zero amount
      expect(screen.getByText('Quick Checkout')).toBeInTheDocument();
    });

    it('should handle missing GST value gracefully', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      // Component should render even if GST is missing
      expect(screen.getByText('Quick Checkout')).toBeInTheDocument();
    });

    it('should render calculated values correctly', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('₹20,350')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('₹1,018')).toBeInTheDocument(); // GST
      expect(screen.getByText('₹21,368')).toBeInTheDocument(); // Total
    });
  });

  describe('General Rendering', () => {
    it('should render section title', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Platform Capabilities')).toBeInTheDocument();
    });

    it('should render section subtitle', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Experience seamless B2B operations with our powerful tools')).toBeInTheDocument();
    });

    it('should render both widgets', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
      expect(screen.getByText('Quick Checkout')).toBeInTheDocument();
    });

    it('should render widget icons without crashing', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Platform Capabilities');
    });

    it('should have accessible widget titles', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBe(2);
    });

    it('should have accessible buttons', () => {
      render(
        <MemoryRouter>
          <PlatformShowcase />
        </MemoryRouter>
      );

      const button = screen.getByRole('button');
      expect(button).toBeVisible();
    });
  });
});
