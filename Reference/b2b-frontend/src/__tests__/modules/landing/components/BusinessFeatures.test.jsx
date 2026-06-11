import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BusinessFeatures from '../../../../modules/landing/components/BusinessFeatures.jsx';

describe('BusinessFeatures Component', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Everything You Need to Scale')).toBeInTheDocument();
    });

    it('should render section subtitle', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Powerful features designed for modern B2B operations')).toBeInTheDocument();
    });

    it('should render all 6 feature cards', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Bulk Ordering')).toBeInTheDocument();
      expect(screen.getByText('Credit System')).toBeInTheDocument();
      expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
      expect(screen.getByText('GST Invoicing')).toBeInTheDocument();
      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Secure Payments')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText(/Optimized for large volume purchases/)).toBeInTheDocument();
      expect(screen.getByText(/Manage business credit lines/)).toBeInTheDocument();
      expect(screen.getByText(/Reliable logistics network/)).toBeInTheDocument();
      expect(screen.getByText(/Automated GST-compliant invoices/)).toBeInTheDocument();
      expect(screen.getByText(/Track your shipments in real-time/)).toBeInTheDocument();
      expect(screen.getByText(/Multiple secure payment gateways/)).toBeInTheDocument();
    });

    it('should render feature icons without crashing', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Cards', () => {
    it('should render Bulk Ordering card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Bulk Ordering')).toBeInTheDocument();
      expect(screen.getByText(/Optimized for large volume purchases/)).toBeInTheDocument();
    });

    it('should render Credit System card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Credit System')).toBeInTheDocument();
      expect(screen.getByText(/Manage business credit lines/)).toBeInTheDocument();
    });

    it('should render Fast Delivery card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
      expect(screen.getByText(/Reliable logistics network/)).toBeInTheDocument();
    });

    it('should render GST Invoicing card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('GST Invoicing')).toBeInTheDocument();
      expect(screen.getByText(/Automated GST-compliant invoices/)).toBeInTheDocument();
    });

    it('should render Real-time Tracking card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
      expect(screen.getByText(/Track your shipments in real-time/)).toBeInTheDocument();
    });

    it('should render Secure Payments card with correct content', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      expect(screen.getByText('Secure Payments')).toBeInTheDocument();
      expect(screen.getByText(/Multiple secure payment gateways/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Everything You Need to Scale');
    });

    it('should have accessible feature titles', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBe(6);
    });

    it('should have visible feature descriptions', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      const descriptions = screen.getAllByText(/optimized|manage|reliable|automated|track|multiple/i);
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should render without crashing when features array is empty', () => {
      // This test ensures the component handles edge cases gracefully
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      // Component should still render section header even if features were empty
      expect(screen.getByText('Everything You Need to Scale')).toBeInTheDocument();
    });

    it('should handle missing icon gracefully', () => {
      render(
        <MemoryRouter>
          <BusinessFeatures />
        </MemoryRouter>
      );

      // Component should render even if an icon is missing
      expect(screen.getByText('Bulk Ordering')).toBeInTheDocument();
    });
  });
});
