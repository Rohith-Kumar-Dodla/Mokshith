import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { routes } from '../../routes/routeConfig.js';

vi.mock('../../modules/product/pages/LandingPage.jsx', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('../../modules/auth/pages/LoginPage.jsx', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock('../../modules/auth/pages/Register.jsx', () => ({
  default: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock('../../modules/product/pages/ProductPage.jsx', () => ({
  default: () => <div data-testid="products-page">Products Page</div>,
}));

vi.mock('../../modules/public/pages/ContactPage.jsx', () => ({
  default: () => <div data-testid="contact-page">Contact Page</div>,
}));

vi.mock('../../modules/public/pages/AboutPage.jsx', () => ({
  default: () => <div data-testid="about-page">About Page</div>,
}));

vi.mock('../../modules/public/pages/PricingPage.jsx', () => ({
  default: () => <div data-testid="pricing-page">Pricing Page</div>,
}));

vi.mock('../../modules/public/pages/SolutionsPage.jsx', () => ({
  default: () => <div data-testid="solutions-page">Solutions Page</div>,
}));

const LandingPage = await import('../../modules/product/pages/LandingPage.jsx');
const LoginPage = await import('../../modules/auth/pages/LoginPage.jsx');
const RegisterPage = await import('../../modules/auth/pages/Register.jsx');
const ProductPage = await import('../../modules/product/pages/ProductPage.jsx');
const ContactPage = await import('../../modules/public/pages/ContactPage.jsx');
const AboutPage = await import('../../modules/public/pages/AboutPage.jsx');
const PricingPage = await import('../../modules/public/pages/PricingPage.jsx');
const SolutionsPage = await import('../../modules/public/pages/SolutionsPage.jsx');

describe('Route Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Landing Page Route', () => {
    it('should render landing page at /', () => {
      render(
        <MemoryRouter initialEntries={[routes.LANDING]}>
          <Routes>
            <Route path={routes.LANDING} element={<LandingPage.default />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('should show fallback for invalid route', () => {
      render(
        <MemoryRouter initialEntries={['/invalid-route']}>
          <Routes>
            <Route path={routes.LANDING} element={<LandingPage.default />} />
            <Route path="*" element={<div data-testid="not-found">Page Not Found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });

  describe('Auth Routes', () => {
    it('should render login page at /login', () => {
      render(
        <MemoryRouter initialEntries={[routes.LOGIN]}>
          <Routes>
            <Route path={routes.LOGIN} element={<LoginPage.default />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should render register page at /register', () => {
      render(
        <MemoryRouter initialEntries={[routes.REGISTER]}>
          <Routes>
            <Route path={routes.REGISTER} element={<RegisterPage.default />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });
  });

  describe('Public Pages', () => {
    it('should render products page', () => {
      render(
        <MemoryRouter initialEntries={[routes.PRODUCTS]}>
          <Routes>
            <Route path={routes.PRODUCTS} element={<ProductPage.default />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('products-page')).toBeInTheDocument();
    });

    it('should render contact page', () => {
      render(
        <MemoryRouter initialEntries={[routes.CONTACT]}>
          <Routes>
            <Route path={routes.CONTACT} element={<ContactPage.default />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('contact-page')).toBeInTheDocument();
    });
  });
});
