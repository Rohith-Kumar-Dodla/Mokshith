import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import Platform from './Platform';
import FilterDropdown from '../../components/superadmin/FilterDropdown';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getStats: vi.fn(),
    getMetrics: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

describe('Super Admin production hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getStats.mockResolvedValue({
      data: {
        admins: 2,
        vendors: 5,
        deliveryPartners: 3,
        products: 10,
        orders: 20,
        revenue: 1000,
        pendingApprovals: 1,
        users: 11,
      },
    });
    superAdminService.getMetrics.mockResolvedValue({
      data: {
        ordersToday: 4,
        revenueToday: 200,
        activeVendors: 5,
        pendingApprovals: 1,
        totalUsers: 11,
      },
    });
    superAdminService.getAuditLogs.mockResolvedValue({ data: [] });
  });

  it('dashboard KPI cards link to role-specific user management tabs', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View Total Admins/i })).toHaveAttribute(
        'href',
        '/super-admin/user-management?tab=admins'
      );
    });

    expect(screen.getByRole('link', { name: /View Total Vendors/i })).toHaveAttribute(
      'href',
      '/super-admin/user-management?tab=vendors'
    );
    expect(screen.getByRole('link', { name: /View Delivery Partners/i })).toHaveAttribute(
      'href',
      '/super-admin/user-management?tab=delivery'
    );
  });

  it('dashboard shows API error state', async () => {
    superAdminService.getStats.mockRejectedValue(new Error('stats failed'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/stats failed/i)).toBeInTheDocument();
    });
  });

  it('platform monitoring keeps cosmetic health tiles non-clickable except orders today', async () => {
    render(
      <MemoryRouter>
        <Platform />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View Total Vendors/i })).toBeInTheDocument();
    });

    expect(screen.getByText('Server Uptime').closest('a')).toBeNull();
    expect(screen.getByText('System Status').closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: /View Orders Today/i })).toHaveAttribute(
      'href',
      '/super-admin/orders'
    );
  });

  it('FilterDropdown applies, indicates active filter, and clears', () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    const { rerender } = render(
      <FilterDropdown
        label="Filter"
        options={[
          { label: 'All Status', value: 'all' },
          { label: 'Active', value: 'active' },
        ]}
        selected="all"
        onSelect={onSelect}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Active' }));
    expect(onSelect).toHaveBeenCalledWith('active');

    rerender(
      <FilterDropdown
        label="Filter"
        options={[
          { label: 'All Status', value: 'all' },
          { label: 'Active', value: 'active' },
        ]}
        selected="active"
        onSelect={onSelect}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Active/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear filter/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
