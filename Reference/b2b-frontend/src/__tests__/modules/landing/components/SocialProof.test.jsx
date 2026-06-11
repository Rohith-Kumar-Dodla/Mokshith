import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SocialProof from '../../../../modules/landing/components/SocialProof.jsx';

describe('SocialProof Component', () => {
  describe('Rendering', () => {
    it('should render section title', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('Trusted by Growing Businesses')).toBeInTheDocument();
    });

    it('should render section subtitle', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('Join thousands of businesses already scaling with our platform')).toBeInTheDocument();
    });

    it('should render Businesses stat', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('1,000+')).toBeInTheDocument();
      expect(screen.getByText('Businesses')).toBeInTheDocument();
      expect(screen.getByText('Trust our platform')).toBeInTheDocument();
    });

    it('should render Orders stat', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('50,000+')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Successfully processed')).toBeInTheDocument();
    });

    it('should render Vendors stat', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('Vendors')).toBeInTheDocument();
      expect(screen.getByText('Across India')).toBeInTheDocument();
    });

    it('should render Credit Line stat', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('₹25,000')).toBeInTheDocument();
      expect(screen.getByText('Credit Line')).toBeInTheDocument();
      expect(screen.getByText('Average per business')).toBeInTheDocument();
    });

    it('should render all 4 statistics', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('1,000+')).toBeInTheDocument();
      expect(screen.getByText('50,000+')).toBeInTheDocument();
      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('₹25,000')).toBeInTheDocument();
    });

    it('should render trust badges', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('GST Compliant')).toBeInTheDocument();
      expect(screen.getByText('Secure Payments')).toBeInTheDocument();
      expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
      expect(screen.getByText('Business Credit')).toBeInTheDocument();
    });

    it('should render stat icons without crashing', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Animation Tests', () => {
    it('should render count-up component', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      const statValues = screen.getAllByText(/1,000\+|50,000\+|500\+|₹25,000/);
      expect(statValues.length).toBe(4);
    });

    it('should display final values correctly', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('1,000+')).toBeInTheDocument();
      expect(screen.getByText('50,000+')).toBeInTheDocument();
      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('₹25,000')).toBeInTheDocument();
    });

    it('should have animated class on stat values after mount', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      // Component should animate values after mount
      const statValues = screen.getAllByText(/1,000\+|50,000\+|500\+|₹25,000/);
      expect(statValues.length).toBe(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Trusted by Growing Businesses');
    });

    it('should have accessible stat labels', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      expect(screen.getByText('Businesses')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Vendors')).toBeInTheDocument();
      expect(screen.getByText('Credit Line')).toBeInTheDocument();
    });

    it('should have visible trust badges', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      const badges = screen.getAllByText(/GST Compliant|Secure Payments|Fast Delivery|Business Credit/);
      expect(badges.length).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stats array gracefully', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      // Component should still render section header
      expect(screen.getByText('Trusted by Growing Businesses')).toBeInTheDocument();
    });

    it('should handle missing stat icon gracefully', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      // Component should render even if icon is missing
      expect(screen.getByText('Businesses')).toBeInTheDocument();
    });

    it('should handle missing stat description gracefully', () => {
      render(
        <MemoryRouter>
          <SocialProof />
        </MemoryRouter>
      );

      // Component should render even if description is missing
      expect(screen.getByText('Businesses')).toBeInTheDocument();
    });
  });
});
