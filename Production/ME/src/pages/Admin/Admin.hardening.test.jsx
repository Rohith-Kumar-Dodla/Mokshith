import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './Dashboard';
import Vendors from './Vendors';
import adminService from '../../services/adminService';

vi.mock('../../services/adminService', () => ({
  default: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    approveUser: vi.fn(),
    rejectUser: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('../../hooks/useNotifications', () => ({
  default: () => ({ notifications: [], unreadCount: 0 }),
}));

describe('Admin Dashboard KPI drill-down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue({
      data: {
        totalOrders: 12,
        totalVendors: 5,
        totalDeliveryPartners: 3,
        pendingApprovals: 1,
        totalAdmins: 2,
        totalUsers: 20,
      },
    });
  });

  it('links Total Orders, Total Vendors, and Delivery Partners KPIs', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /View Total Orders/i })).toHaveAttribute('href', '/admin/orders');
    });
    expect(screen.getByRole('link', { name: /View Total Vendors/i })).toHaveAttribute('href', '/admin/vendors');
    expect(screen.getByRole('link', { name: /View Delivery Partners/i })).toHaveAttribute(
      'href',
      '/admin/delivery-assignment?tab=partners'
    );
  });
});

describe('Admin Vendors KPI filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getUsers.mockResolvedValue({
      data: [
        { _id: '1', businessName: 'Active Shop', name: 'Owner Active', status: 'ACTIVE', mobile: '9999999999' },
        { _id: '2', businessName: 'Pending Shop', name: 'Owner Pending', status: 'PENDING', mobile: '8888888888' },
        { _id: '3', businessName: 'Suspended Shop', name: 'Owner Suspended', status: 'SUSPENDED', mobile: '7777777777' },
      ],
    });
  });

  it('Total shows all vendors and Active filters to approved only', async () => {
    render(
      <MemoryRouter>
        <Vendors />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Shop')).toBeInTheDocument();
    });
    expect(screen.getByText('Pending Shop')).toBeInTheDocument();
    expect(screen.getByText('Suspended Shop')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show Active Vendors/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Show Active Vendors/i })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.getByText('Active Shop')).toBeInTheDocument();
    expect(screen.queryByText('Pending Shop')).not.toBeInTheDocument();
    expect(screen.queryByText('Suspended Shop')).not.toBeInTheDocument();
  });
});
