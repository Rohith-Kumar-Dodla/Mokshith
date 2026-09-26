import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DeliveryOfferCard from './DeliveryOfferCard';

const offer = {
  _id: 'offer-1',
  logisticsId: 'logistics-1',
  orderId: {
    _id: 'order-12345678',
    totalAmount: 8450,
    paymentStatus: 'PAID',
    address: { addressLine: '1 Main Road', city: 'Hyderabad' },
  },
  status: 'OFFERED',
  deliveryAmount: 120,
  distance: 5.2,
  distanceUnit: 'KM',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

describe('DeliveryOfferCard', () => {
  it('shows earnings and sends accept action', () => {
    const onAccept = vi.fn();
    render(<DeliveryOfferCard offer={offer} actionLoading={false} onAccept={onAccept} onReject={vi.fn()} />);
    expect(screen.getByText('₹120')).toBeInTheDocument();
    expect(screen.getByText('5.2 KM')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('requires an Other explanation before submitting rejection', () => {
    const onReject = vi.fn();
    render(<DeliveryOfferCard offer={offer} actionLoading={false} onAccept={vi.fn()} onReject={onReject} />);
    fireEvent.click(screen.getByRole('button', { name: /reject$/i }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'OTHER' } });
    expect(screen.getByRole('button', { name: /confirm reject/i })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/short explanation/i), { target: { value: 'Vehicle issue' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm reject/i }));
    expect(onReject).toHaveBeenCalledWith({ rejectionCode: 'OTHER', reason: 'Vehicle issue' });
  });
});
