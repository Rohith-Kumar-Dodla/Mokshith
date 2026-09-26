import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './Dashboard';
import Vendors from './Vendors';
import adminService from '../../services/adminService';
import deliveryService from '../../services/deliveryService';
import inventoryService from '../../services/inventoryService';
import orderService from '../../services/orderService';

vi.mock('../../services/adminService', () => ({
  default: {
    getStats: vi.fn(),
    getUsers: vi.fn(),
    approveUser: vi.fn(),
    rejectUser: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('../../services/deliveryService', () => ({
  default: {
    getDeliveryQueue: vi.fn(),
  },
}));

vi.mock('../../services/inventoryService', () => ({
  default: {
    getLowStockItems: vi.fn(),
  },
}));

vi.mock('../../services/orderService', () => ({
  default: {
    getAllOrders: vi.fn(),
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
        pendingOrders: 4,
        codOrders: 3,
        paidOrders: 9,
        unassignedDeliveries: 2,
        activeDeliveries: 5,
        lowStock: 1,
        deliveryRejections: 1,
      },
    });
    orderService.getAllOrders.mockResolvedValue({ data: { orders: [], pagination: {} } });
    deliveryService.getDeliveryQueue.mockResolvedValue({ data: [] });
    inventoryService.getLowStockItems.mockResolvedValue({ data: [] });
  });

  it('links operational Home KPIs to the canonical admin workflows', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Total Orders/i })).toHaveAttribute('href', '/admin/orders');
    });
    expect(screen.getByRole('link', { name: /Pending Orders/i })).toHaveAttribute('href', '/admin/orders?status=PENDING');
    expect(screen.getByRole('link', { name: /Unassigned Deliveries/i })).toHaveAttribute(
      'href',
      '/admin/orders?deliveryFilter=unassigned'
    );
    expect(screen.getByRole('link', { name: /Low Stock/i })).toHaveAttribute('href', '/admin/inventory');
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
