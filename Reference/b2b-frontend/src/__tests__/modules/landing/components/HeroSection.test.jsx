import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from '../../../../modules/landing/components/HeroSection.jsx';
import { useAuth } from '../../../../modules/auth/hooks/useAuth.js';
import { routes } from '../../../../routes/routeConfig.js';

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

describe('HeroSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render hero heading', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Smart B2B Commerce Platform for Growing Businesses')).toBeInTheDocument();
    });

    it('should render hero subheading', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText(/Manage bulk purchases/)).toBeInTheDocument();
    });

    it('should render Get Started button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should render Browse Products button', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Browse Products')).toBeInTheDocument();
    });

    it('should render trust badges', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('GST Compliant')).toBeInTheDocument();
      expect(screen.getByText('Secure Payments')).toBeInTheDocument();
      expect(screen.getByText('Business Credit')).toBeInTheDocument();
      expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    });

    it('should render dashboard mockup', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
    });

    it('should render floating cards', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Credit Line')).toBeInTheDocument();
      expect(screen.getByText('Active Shipments')).toBeInTheDocument();
      expect(screen.getByText('Orders Completed')).toBeInTheDocument();
    });

    it('should display "Go to Dashboard" when user is logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('should display "Get Started" when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should navigate to register when Get Started is clicked (not logged in)', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const getStartedButton = screen.getByText('Get Started');
      await user.click(getStartedButton);

      expect(mockNavigate).toHaveBeenCalledWith(routes.REGISTER);
    });

    it('should navigate to dashboard when Get Started is clicked (logged in)', async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({ user: { name: 'Test User' } });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const dashboardButton = screen.getByText('Go to Dashboard');
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith(routes.DASHBOARD);
    });

    it('should have correct href for Browse Products link', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const browseLink = screen.getByText('Browse Products').closest('a');
      expect(browseLink).toHaveAttribute('href', routes.PRODUCTS);
    });
  });

  describe('Content Validation', () => {
    it('should contain main headline text', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Smart B2B Commerce Platform');
    });

    it('should have visible CTA buttons', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display trusted by badge', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Trusted by 1,000+ businesses')).toBeInTheDocument();
    });

    it('should render mockup stats', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Credit Available')).toBeInTheDocument();
    });

    it('should render mockup list items', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Bulk Rice Order')).toBeInTheDocument();
      expect(screen.getByText('Edible Oil Supply')).toBeInTheDocument();
      expect(screen.getByText('Pulses Bulk Order')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

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

    it('should have accessible link text', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      const browseLink = screen.getByText('Browse Products');
      expect(browseLink).toHaveTextContent('Browse Products');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user gracefully', () => {
      vi.mocked(useAuth).mockReturnValue({ user: null });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should handle user object without name', () => {
      vi.mocked(useAuth).mockReturnValue({ user: {} });

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should render without crashing when auth hook returns undefined', () => {
      vi.mocked(useAuth).mockReturnValue({});

      render(
        <MemoryRouter>
          <HeroSection />
        </MemoryRouter>
      );

      expect(screen.getByText(/Smart B2B Commerce Platform for Growing Businesses/)).toBeInTheDocument();
    });
  });
});
