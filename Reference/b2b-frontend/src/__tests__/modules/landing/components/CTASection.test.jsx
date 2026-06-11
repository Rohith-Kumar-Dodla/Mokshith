import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CTASection from '../../../../modules/landing/components/CTASection.jsx';
import { useAuth } from '../../../../modules/auth/hooks/useAuth.js';
import { routes } from '../../../../routes/routeConfig.js';
import { useAuth as mockUseAuth } from '../../../../modules/auth/hooks/useAuth.js';

// Mock the useAuth hook
vi.mock('../../../../modules/auth/hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CTASection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render heading', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Ready to Transform Your Business?')).toBeInTheDocument();
    });

    it('should render Create Your Account button when not logged in', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    });

    it('should render Go to Dashboard button when logged in', () => {
      mockUseAuth.mockReturnValue({ user: { name: 'Test User' } });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should render Contact Sales button', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Contact Sales')).toBeInTheDocument();
    });

    it('should render feature checks', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Free to sign up')).toBeInTheDocument();
      expect(screen.getByText('No credit card required')).toBeInTheDocument();
      expect(screen.getByText('Instant business credit')).toBeInTheDocument();
    });

    it('should render credit card mockup', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('BUSINESS CREDIT')).toBeInTheDocument();
      expect(screen.getByText('₹25,000')).toBeInTheDocument();
    });

    it('should render floating badges', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
      expect(screen.getByText('Instant Approval')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to register when Create Your Account is clicked (not logged in)', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const createAccountButton = screen.getByText('Create Your Account');
      await user.click(createAccountButton);

      expect(mockNavigate).toHaveBeenCalledWith(routes.REGISTER);
    });

    it('should navigate to dashboard when Go to Dashboard is clicked (logged in)', async () => {
      const user = userEvent.setup();
      mockUseAuth.mockReturnValue({ user: { name: 'Test User' } });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const dashboardButton = screen.getByText('Go to Dashboard');
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith(routes.DASHBOARD);
    });

    it('should have correct href for Contact Sales link', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const contactLink = screen.getByText('Contact Sales').closest('a');
      expect(contactLink).toHaveAttribute('href', routes.CONTACT);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Ready to Transform Your Business?');
    });

    it('should have accessible button labels', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('should have accessible link text', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      const contactLink = screen.getByText('Contact Sales');
      expect(contactLink).toHaveTextContent('Contact Sales');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    });

    it('should handle user object without name', () => {
      mockUseAuth.mockReturnValue({ user: {} });

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should render without crashing when auth hook returns undefined', () => {
      mockUseAuth.mockReturnValue({});

      render(
        <MemoryRouter>
          <CTASection />
        </MemoryRouter>
      );

      expect(screen.getByText('Ready to Transform Your Business?')).toBeInTheDocument();
    });
  });
});
