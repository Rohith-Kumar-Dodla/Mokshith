import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PurchaseRequests from './PurchaseRequests';
import PurchaseRequestCreate from './PurchaseRequestCreate';
import SupplierAllocationPanel from './SupplierAllocationPanel';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    listPurchaseRequests: vi.fn(),
    getPurchaseRequest: vi.fn(),
    getProcurementDemand: vi.fn(),
    getDemandProductSupplierAllocation: vi.fn(),
    createPurchaseRequest: vi.fn(),
    submitPurchaseRequest: vi.fn(),
    cancelPurchaseRequest: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const sampleRequests = [{
  _id: '64pr001',
  purchaseRequestNumber: 'PR-2026-0001',
  supplierNameSnapshot: 'ABC Oils',
  demandDate: '2026-08-17',
  status: 'DRAFT',
  totalEstimatedCost: 11600,
  items: [{ productId: 'p1' }, { productId: 'p2' }],
}];

describe('PurchaseRequests - Phase 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.listPurchaseRequests.mockResolvedValue({
      data: { purchaseRequests: sampleRequests, total: 1, page: 1, pages: 1 },
    });
  });

  it('loads purchase requests list with procurement navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/super-admin/procurement/purchase-requests']}>
        <Routes>
          <Route path="/super-admin/procurement/purchase-requests" element={<PurchaseRequests />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Purchase Requests' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Demand' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Purchase Request' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('PR-2026-0001')).toBeInTheDocument());
    expect(screen.getByText('ABC Oils')).toBeInTheDocument();
  });
});

describe('PurchaseRequestCreate - Phase 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getProcurementDemand.mockResolvedValue({
      data: {
        date: '2026-08-17',
        products: [{ productId: 'p1', productName: 'Sunflower Oil', requiredQuantity: 100 }],
      },
    });
  });

  it('shows demand products and create purchase request builder', async () => {
    render(
      <MemoryRouter initialEntries={['/super-admin/procurement/purchase-requests/new?date=2026-08-17']}>
        <Routes>
          <Route path="/super-admin/procurement/purchase-requests/new" element={<PurchaseRequestCreate />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sunflower Oil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allocate Supplier' })).toBeInTheDocument();
    expect(screen.getByText('Purchase Request Builder')).toBeInTheDocument();
  });
});

describe('SupplierAllocationPanel - Phase 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getDemandProductSupplierAllocation.mockResolvedValue({
      data: {
        demandQuantity: 100,
        product: { name: 'Sunflower Oil' },
        suppliers: [
          {
            supplierId: 's1',
            supplierName: 'ABC Oils',
            mappingId: 'm1',
            currentSupplierPrice: 100,
            minimumOrderQuantity: 20,
            availabilityStatus: 'ACTIVE',
            isLowestPrice: true,
            suggestedPurchaseQuantity: 100,
          },
          {
            supplierId: 's2',
            supplierName: 'XYZ Traders',
            mappingId: 'm2',
            currentSupplierPrice: 120,
            minimumOrderQuantity: 10,
            availabilityStatus: 'ACTIVE',
            isLowestPrice: false,
            suggestedPurchaseQuantity: 100,
          },
        ],
      },
    });
  });

  it('shows supplier comparison with lowest price and requires explicit selection', async () => {
    const onAddItem = vi.fn().mockResolvedValue(undefined);
    render(
      <SupplierAllocationPanel
        isOpen
        onClose={vi.fn()}
        demandDate="2026-08-17"
        product={{ productId: 'p1', productName: 'Sunflower Oil', requiredQuantity: 100 }}
        onAddItem={onAddItem}
      />
    );

    expect(await screen.findByText('Lowest Price')).toBeInTheDocument();
    expect(screen.getByText('ABC Oils')).toBeInTheDocument();
    expect(screen.getByText('XYZ Traders')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to Purchase Request' })).toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0]);
    expect(screen.getAllByText(/Supplier Purchase Price/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Purchase Request' }));
    await waitFor(() => expect(onAddItem).toHaveBeenCalled());
  });
});
