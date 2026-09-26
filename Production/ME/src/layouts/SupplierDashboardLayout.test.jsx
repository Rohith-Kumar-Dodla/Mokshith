import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierDashboardLayout from './SupplierDashboardLayout';
import { mockMatchMedia } from '../../tests/utils/testHelpers';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Super Admin', email: 'superadmin@mokshith.com' }, logout: vi.fn() }),
}));

describe('SupplierDashboardLayout', () => {
  beforeEach(() => mockMatchMedia(true));

  const renderLayout = (path = '/supplier-dashboard') => render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/supplier-dashboard/*" element={<SupplierDashboardLayout />}>
          <Route index element={<div>Supplier dashboard content</div>} />
          <Route path="suppliers" element={<div>Supplier placeholder</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  it('renders the dedicated navigation and nested content', () => {
    renderLayout();
    expect(screen.getByText('Supplier dashboard content')).toBeInTheDocument();
    for (const label of ['Dashboard', 'Suppliers', 'Categories', 'Products', 'Settings']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('supports the existing mobile menu behavior', () => {
    mockMatchMedia(false);
    renderLayout();
    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('link', { name: 'Suppliers' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
