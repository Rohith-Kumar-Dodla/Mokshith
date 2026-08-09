import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SuperAdminOrderManagement from '../../components/superadmin/SuperAdminOrderManagement';
import orderService from '../../services/orderService';

vi.mock('../../services/orderService', () => ({
  default: {
    getAllOrders: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false }),
}));

vi.mock('../../hooks/useDebouncedValue', () => ({
  default: (value) => value,
}));

function mockOrdersResponse(orders, total = orders.length) {
  return {
    data: {
      orders,
      pagination: { page: 1, limit: 20, total, pages: 1 },
    },
  };
}

describe('SuperAdminOrderManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderService.getAllOrders.mockImplementation(async (params = {}) => {
      if (params.paymentCompleted) {
        return mockOrdersResponse([
          {
            _id: 'o1',
            orderNumber: 'o1',
            status: 'COMPLETED',
            paymentMethod: 'ONLINE',
            paymentStatus: 'PAID',
            totalAmount: 500,
            createdAt: '2026-06-01T00:00:00.000Z',
            userId: { name: 'Online Vendor' },
            items: [],
          },
          {
            _id: 'o2',
            orderNumber: 'o2',
            status: 'DELIVERED',
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            totalAmount: 300,
            createdAt: '2026-06-02T00:00:00.000Z',
            userId: { name: 'COD Vendor' },
            items: [],
          },
        ], 2);
      }
      if (params.paymentMethod === 'COD') {
        return mockOrdersResponse([
          {
            _id: 'o2',
            orderNumber: 'o2',
            status: 'CONFIRMED',
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            totalAmount: 300,
            createdAt: '2026-06-02T00:00:00.000Z',
            userId: { name: 'COD Vendor' },
            items: [],
          },
        ], 1);
      }
      return mockOrdersResponse([
        {
          _id: 'o1',
          orderNumber: 'o1',
          status: 'COMPLETED',
          paymentMethod: 'ONLINE',
          paymentStatus: 'PAID',
          totalAmount: 500,
          createdAt: '2026-06-01T00:00:00.000Z',
          userId: { name: 'Online Vendor' },
          items: [],
        },
        {
          _id: 'o2',
          orderNumber: 'o2',
          status: 'CONFIRMED',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          totalAmount: 300,
          createdAt: '2026-06-02T00:00:00.000Z',
          userId: { name: 'COD Vendor' },
          items: [],
        },
        {
          _id: 'o3',
          orderNumber: 'o3',
          status: 'PENDING',
          paymentMethod: 'ONLINE',
          paymentStatus: 'PENDING',
          totalAmount: 100,
          createdAt: '2026-06-03T00:00:00.000Z',
          userId: { name: 'Unpaid Online' },
          items: [],
        },
      ], 3);
    });
  });

  it('Total KPI loads all orders and Completed shows payment methods', async () => {
    render(
      <MemoryRouter>
        <SuperAdminOrderManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Online Vendor')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Show all orders/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show payment-completed orders/i }));

    await waitFor(() => {
      expect(orderService.getAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ paymentCompleted: true })
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('ONLINE').length).toBeGreaterThan(0);
      expect(screen.getAllByText('COD').length).toBeGreaterThan(0);
    });
  });

  it('COD KPI requests paymentMethod COD only', async () => {
    render(
      <MemoryRouter>
        <SuperAdminOrderManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Show COD payment method orders/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Show COD payment method orders/i }));

    await waitFor(() => {
      expect(orderService.getAllOrders).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'COD' })
      );
    });
  });

  it('shows API error state', async () => {
    orderService.getAllOrders.mockRejectedValue(new Error('orders failed'));

    render(
      <MemoryRouter>
        <SuperAdminOrderManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/orders failed/i)).toBeInTheDocument();
    });
  });
});
