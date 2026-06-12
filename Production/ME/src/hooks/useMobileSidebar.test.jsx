import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useMobileSidebar } from './useMobileSidebar';

function MobileSidebarHarness() {
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useMobileSidebar();
  const navigate = useNavigate();

  return (
    <div>
      <span data-testid="menu-state">{String(mobileMenuOpen)}</span>
      <button type="button" onClick={openMobileMenu}>Open Menu</button>
      <button type="button" onClick={closeMobileMenu}>Close Menu</button>
      <button type="button" onClick={() => navigate('/admin/orders')}>Navigate</button>
    </div>
  );
}

describe('useMobileSidebar', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('toggles mobile menu open state', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <MobileSidebarHarness />
      </MemoryRouter>
    );

    expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(screen.getByTestId('menu-state')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'Close Menu' }));
    expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
  });

  it('locks body scroll while menu is open', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <MobileSidebarHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Close Menu' }));
    expect(document.body.style.overflow).toBe('');
  });

  it('closes menu on Escape key', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <MobileSidebarHarness />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
  });

  it('closes menu when route changes', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="*" element={<MobileSidebarHarness />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }));
    expect(screen.getByTestId('menu-state')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));

    await waitFor(() => {
      expect(screen.getByTestId('menu-state')).toHaveTextContent('false');
    });
  });
});
