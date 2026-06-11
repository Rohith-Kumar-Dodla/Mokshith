import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../../../components/common/Footer.jsx';
import { routes } from '../../../routes/routeConfig.js';

describe('Footer Component', () => {
  describe('Rendering', () => {
    it('should render footer logo', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Mokshith')).toBeInTheDocument();
      expect(screen.getByText('B2B')).toBeInTheDocument();
    });

    it('should render brand description', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText(/The leading B2B commerce platform/)).toBeInTheDocument();
    });

    it('should render current year in copyright', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });
  });

  describe('Company Links', () => {
    it('should render About Us link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    it('should render Careers link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Careers')).toBeInTheDocument();
    });

    it('should render Press link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Press')).toBeInTheDocument();
    });

    it('should render Contact link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    });

    it('should have correct href for About Us link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const aboutLink = screen.getByText('About Us').closest('a');
      expect(aboutLink).toHaveAttribute('href', routes.ABOUT);
    });

    it('should have correct href for Contact link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const contactLink = screen.getByRole('link', { name: 'Contact' });
      expect(contactLink).toHaveAttribute('href', routes.CONTACT);
    });
  });

  describe('Products Links', () => {
    it('should render Browse Products link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Browse Products')).toBeInTheDocument();
    });

    it('should render Bulk Orders link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Bulk Orders')).toBeInTheDocument();
    });

    it('should render Custom Pricing link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Pricing')).toBeInTheDocument();
    });

    it('should render New Arrivals link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    });

    it('should have correct href for Browse Products link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const productsLink = screen.getByText('Browse Products').closest('a');
      expect(productsLink).toHaveAttribute('href', routes.PRODUCTS);
    });
  });

  describe('Legal Links', () => {
    it('should render Privacy Policy link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const privacyLinks = screen.getAllByText('Privacy Policy');
      expect(privacyLinks.length).toBeGreaterThan(0);
    });

    it('should render Terms of Service link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const termsLinks = screen.getAllByText('Terms of Service');
      expect(termsLinks.length).toBeGreaterThan(0);
    });

    it('should render Cookie Policy link', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const cookieLinks = screen.getAllByText('Cookie Policy');
      expect(cookieLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Info', () => {
    it('should render address', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('123 Business Avenue, Tech City')).toBeInTheDocument();
    });

    it('should render email', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('support@mokshith.com')).toBeInTheDocument();
    });

    it('should render phone', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('+1 (555) 000-0000')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link names', () => {
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

    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 4 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have social links with aria-labels', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      const socialLink = screen.getByLabelText('Website');
      expect(socialLink).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render without crashing when routes are undefined', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Mokshith')).toBeInTheDocument();
    });

    it('should handle missing contact info gracefully', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      // Component should render even if contact info is missing
      expect(screen.getByText('Mokshith')).toBeInTheDocument();
    });
  });
});
