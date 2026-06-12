import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FiGrid } from 'react-icons/fi';
import PortalSidebar from './PortalSidebar';
import { mockMatchMedia } from '../../../tests/utils/testHelpers';

const menuItems = [
  { path: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
  { path: '/admin/orders', icon: FiGrid, label: 'Orders' },
];

function SidebarHarness({ onLogoutClick = () => {} }) {
  return (
    <PortalSidebar
      id="test-sidebar"
      menuItems={menuItems}
      brandSubtitle="Admin Portal"
      sidebarOpen
      mobileMenuOpen
      onMobileClose={() => {}}
      onLogoutClick={onLogoutClick}
      isActive={(path) => path === '/admin/dashboard'}
    />
  );
}

describe('PortalSidebar', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders navigation links with accessible labels', () => {
    render(
      <MemoryRouter>
        <SidebarHarness />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Orders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  it('calls onLogoutClick when logout is clicked', () => {
    let logoutClicked = false;
    render(
      <MemoryRouter>
        <SidebarHarness onLogoutClick={() => { logoutClicked = true; }} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(logoutClicked).toBe(true);
  });

  it('closes mobile menu via backdrop click', () => {
    const onMobileClose = vi.fn();
    render(
      <MemoryRouter>
        <PortalSidebar
          id="test-sidebar"
          menuItems={menuItems}
          brandSubtitle="Admin Portal"
          sidebarOpen
          mobileMenuOpen
          onMobileClose={onMobileClose}
          onLogoutClick={() => {}}
          isActive={() => false}
        />
      </MemoryRouter>
    );

    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    fireEvent.click(backdrop);
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it('closes mobile menu when a nav link is clicked', () => {
    const onMobileClose = vi.fn();

    function Harness() {
      return (
        <PortalSidebar
          id="test-sidebar"
          menuItems={menuItems}
          brandSubtitle="Admin Portal"
          sidebarOpen
          mobileMenuOpen
          onMobileClose={onMobileClose}
          onLogoutClick={() => {}}
          isActive={() => false}
        />
      );
    }

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="*" element={<Harness />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: /Orders/i }));
    expect(onMobileClose).toHaveBeenCalled();
  });
});
