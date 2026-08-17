import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PurchaseRequests, { PurchaseRequestDetails } from './PurchaseRequests';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    listPurchaseRequests: vi.fn(),
    getPurchaseRequest: vi.fn(),
    createPurchaseRequest: vi.fn(),
    submitPurchaseRequest: vi.fn(),
    cancelPurchaseRequest: vi.fn(),
    acknowledgePurchaseRequest: vi.fn(),
    receivePurchaseRequest: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const submittedRequest = {
  _id: '64pr001',
  purchaseRequestNumber: 'PR-2026-0001',
  supplierNameSnapshot: 'ABC Oils',
  demandDate: '2026-08-17',
  status: 'SUBMITTED',
  totalEstimatedCost: 10000,
  items: [{
    productId: 'p1',
    productNameSnapshot: 'Sunflower Oil',
    demandQuantity: 100,
    purchaseQuantity: 100,
    supplierPriceSnapshot: 100,
    supplierMOQSnapshot: 20,
    estimatedSubtotal: 10000,
    confirmedQuantity: null,
    receivedQuantity: 0,
    remainingQuantity: null,
    receipts: [],
  }],
};

const acknowledgedRequest = {
  ...submittedRequest,
  status: 'ACKNOWLEDGED',
  expectedDeliveryDate: '2026-08-20',
  supplierResponseNotes: 'Confirmed by phone',
  items: [{
    ...submittedRequest.items[0],
    confirmedQuantity: 100,
    remainingQuantity: 100,
  }],
};

describe('PurchaseRequests fulfillment - Phase 5.2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows acknowledge action for submitted requests', async () => {
    superAdminService.getPurchaseRequest.mockResolvedValue({ data: submittedRequest });

    render(
      <MemoryRouter initialEntries={['/super-admin/procurement/purchase-requests/64pr001']}>
        <Routes>
          <Route path="/super-admin/procurement/purchase-requests/:id" element={<PurchaseRequests />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Acknowledge Request' })).toBeInTheDocument();
  });

  it('opens acknowledge modal and submits supplier response', async () => {
    superAdminService.getPurchaseRequest
      .mockResolvedValueOnce({ data: submittedRequest })
      .mockResolvedValueOnce({ data: acknowledgedRequest });
    superAdminService.acknowledgePurchaseRequest.mockResolvedValue({ data: acknowledgedRequest });

    render(
      <MemoryRouter initialEntries={['/super-admin/procurement/purchase-requests/64pr001']}>
        <Routes>
          <Route path="/super-admin/procurement/purchase-requests/:id" element={<PurchaseRequests />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge Request' }));
    expect(screen.getByRole('heading', { name: 'Acknowledge Supplier Response' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Expected Delivery Date/i), { target: { value: '2026-08-20' } });
    fireEvent.change(screen.getByLabelText(/Supplier Notes/i), { target: { value: 'Confirmed by phone' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Supplier Response' }));

    await waitFor(() => {
      expect(superAdminService.acknowledgePurchaseRequest).toHaveBeenCalledWith('64pr001', expect.objectContaining({
        items: [{ productId: 'p1', confirmedQuantity: 100 }],
        expectedDeliveryDate: '2026-08-20',
        supplierResponseNotes: 'Confirmed by phone',
      }));
    });
  });

  it('shows receive action and records partial receipt', async () => {
    superAdminService.getPurchaseRequest
      .mockResolvedValueOnce({ data: acknowledgedRequest })
      .mockResolvedValueOnce({
        data: {
          ...acknowledgedRequest,
          status: 'PARTIALLY_FULFILLED',
          items: [{
            ...acknowledgedRequest.items[0],
            receivedQuantity: 60,
            remainingQuantity: 40,
            receipts: [{ _id: 'r1', quantity: 60, receivedAt: '2026-08-17T10:00:00.000Z', notes: 'First' }],
          }],
        },
      });
    superAdminService.receivePurchaseRequest.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/super-admin/procurement/purchase-requests/64pr001']}>
        <Routes>
          <Route path="/super-admin/procurement/purchase-requests/:id" element={<PurchaseRequests />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Record Goods Received' }));
    expect(screen.getByRole('heading', { name: 'Record Goods Received' })).toBeInTheDocument();
    expect(screen.getByText(/Confirmed Quantity: 100/)).toBeInTheDocument();
    expect(screen.getByText(/Remaining: 100/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Receive Quantity/i), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Receipt' }));

    await waitFor(() => {
      expect(superAdminService.receivePurchaseRequest).toHaveBeenCalledWith('64pr001', {
        productId: 'p1',
        quantity: 60,
        notes: '',
      });
    });
  });

  it('shows receipt history and hides receive action for fulfilled requests', async () => {
    superAdminService.getPurchaseRequest.mockResolvedValue({
      data: {
        ...acknowledgedRequest,
        status: 'FULFILLED',
        items: [{
          ...acknowledgedRequest.items[0],
          receivedQuantity: 100,
          remainingQuantity: 0,
          receipts: [
            { _id: 'r1', quantity: 60, receivedAt: '2026-08-17T10:00:00.000Z', notes: '' },
            { _id: 'r2', quantity: 40, receivedAt: '2026-08-19T10:00:00.000Z', notes: '' },
          ],
        }],
      },
    });

    render(
      <PurchaseRequestDetails requestId="64pr001" onClose={vi.fn()} />
    );

    expect(await screen.findByText('Receiving History')).toBeInTheDocument();
    expect(screen.getAllByText('Sunflower Oil').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Record Goods Received' })).not.toBeInTheDocument();
  });

  it('shows cancelled request without fulfillment actions', async () => {
    superAdminService.getPurchaseRequest.mockResolvedValue({
      data: { ...submittedRequest, status: 'CANCELLED' },
    });

    render(
      <PurchaseRequestDetails requestId="64pr001" onClose={vi.fn()} />
    );

    await waitFor(() => expect(screen.getByText('PR-2026-0001')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Acknowledge Request' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Goods Received' })).not.toBeInTheDocument();
  });
});
