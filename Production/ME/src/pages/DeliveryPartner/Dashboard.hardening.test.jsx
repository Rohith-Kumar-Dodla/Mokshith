import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeliveryDashboard from './Dashboard';

vi.mock('../../hooks/useDelivery', () => ({
  default: vi.fn(),
}));

import useDelivery from '../../hooks/useDelivery';

describe('Delivery Dashboard — Assigned Orders KPI', () => {
  beforeEach(() => {
    useDelivery.mockReturnValue({
      assignments: [
        {
          id: 'ship-1',
          vendor: 'Shop A',
          deliveryLocation: 'Hyderabad',
          orderAmount: 100,
          distance: 2,
          status: 'assigned',
        },
      ],
      analytics: {
        today: {
          assignedOrders: 1,
          pendingDeliveries: 0,
          completedDeliveries: 0,
          todaysEarnings: 0,
          monthlyEarnings: 0,
          averageRating: 0,
          successRate: 100,
        },
        activityTimeline: [],
      },
      loading: false,
      error: null,
    });
  });

  it('links Assigned Orders KPI to the assigned-orders page', () => {
    render(
      <MemoryRouter>
        <DeliveryDashboard />
      </MemoryRouter>
    );

    const kpi = screen.getByRole('link', { name: 'View Assigned Orders' });
    expect(kpi).toHaveAttribute('href', '/delivery/assigned-orders');
    expect(kpi).toHaveTextContent('Assigned Orders');
    expect(kpi).toHaveTextContent('1');
  });
});
