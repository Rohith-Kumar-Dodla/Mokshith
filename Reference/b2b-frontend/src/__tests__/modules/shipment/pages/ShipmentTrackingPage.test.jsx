import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ShipmentTrackingPage from '../../../../modules/shipment/pages/ShipmentTrackingPage.jsx';

vi.mock('../../../../modules/shipment/hooks/useShipment.js', () => ({
  useShipment: () => ({
    shipment: {
      _id: 'ship-001',
      status: 'SHIPPED',
      customerName: 'Test Customer',
      shippingAddress: '123 Test St',
      estimatedDeliveryDate: 'Tomorrow',
      items: [{ name: 'Rice', quantity: 1, price: 100 }],
      totalValue: 100,
    },
    loading: false,
    error: null,
  }),
}));

describe('ShipmentTrackingPage', () => {
  it('renders shipment tracking details', () => {
    render(
      <MemoryRouter initialEntries={['/shipment/ship-001']}>
        <Routes>
          <Route path="/shipment/:id" element={<ShipmentTrackingPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Track Shipment')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
  });
});
