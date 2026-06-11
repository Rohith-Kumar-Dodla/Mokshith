import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLogisticsPage from '../../../../modules/logistics/pages/AdminLogisticsPage.jsx';

vi.mock('../../../../modules/logistics/hooks/useAdminLogistics.js', () => ({
  useAdminLogistics: () => ({
    queue: {
      pending: [{ _id: '1', customerName: 'Test Customer', address: '123 St', status: 'PENDING', orderId: { _id: 'ord-1' }, trackingNumber: 'TRK-1' }],
      assigned: [],
      all: [{ _id: '1', customerName: 'Test Customer', address: '123 St', status: 'PENDING', orderId: { _id: 'ord-1' }, trackingNumber: 'TRK-1' }],
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('AdminLogisticsPage', () => {
  it('renders logistics queue heading', () => {
    render(<AdminLogisticsPage />);
    expect(screen.getByText('Logistics Queue')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });
});
