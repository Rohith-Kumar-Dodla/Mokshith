import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProcurementPlan from './ProcurementPlan';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getProcurementPlanByDate: vi.fn(),
    createProcurementPlan: vi.fn(),
    updateProcurementPlan: vi.fn(),
    confirmProcurementPlan: vi.fn(),
    cancelProcurementPlan: vi.fn(),
    getProcurementPlanSupplierOptions: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const oilItem = {
  productId: 'prod-oil',
  productNameSnapshot: 'Sunflower Oil',
  requiredQuantity: 100,
  supplierId: null,
  supplierProductId: null,
  supplierNameSnapshot: '',
  plannedQuantity: null,
  supplierPriceSnapshot: null,
  supplierMoqSnapshot: null,
  estimatedCost: 0,
  additionalQuantity: 0,
};

const plannedOil = {
  ...oilItem,
  supplierId: 'sup-abc',
  supplierProductId: 'map-abc',
  supplierNameSnapshot: 'ABC Oils',
  plannedQuantity: 100,
  supplierPriceSnapshot: 100,
  supplierMoqSnapshot: 50,
  estimatedCost: 10000,
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/super-admin/procurement/plans?date=2026-08-17']}>
    <Routes>
      <Route path="/super-admin/procurement/plans" element={<ProcurementPlan />} />
      <Route path="/super-admin/procurement/demand" element={<div>Demand page</div>} />
    </Routes>
  </MemoryRouter>
);

describe('Procurement plan page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getProcurementPlanByDate.mockResolvedValue({
      data: {
        plan: null,
        liveDemand: { date: '2026-08-17', products: [{ productName: 'Sunflower Oil', requiredQuantity: 100 }] },
      },
    });
    superAdminService.createProcurementPlan.mockResolvedValue({
      data: {
        plan: {
          _id: 'plan-1',
          procurementDate: '2026-08-17',
          status: 'DRAFT',
          items: [oilItem],
          totalEstimatedCost: 0,
        },
        warnings: [{ type: 'UNPLANNED', productId: 'prod-oil', message: 'Sunflower Oil has no eligible supplier selected.' }],
        readiness: { productsPlanned: 0, productsRequired: 1, canConfirm: false },
      },
    });
    superAdminService.getProcurementPlanSupplierOptions.mockResolvedValue({
      data: {
        suppliers: [
          {
            supplierId: 'sup-abc',
            mappingId: 'map-abc',
            supplierName: 'ABC Oils',
            currentSupplierPrice: 100,
            minimumOrderQuantity: 50,
            isLowestPrice: true,
          },
          {
            supplierId: 'sup-xyz',
            mappingId: 'map-xyz',
            supplierName: 'XYZ Distributors',
            currentSupplierPrice: 120,
            minimumOrderQuantity: 20,
            isLowestPrice: false,
          },
        ],
      },
    });
    superAdminService.updateProcurementPlan.mockResolvedValue({
      data: {
        plan: {
          _id: 'plan-1',
          procurementDate: '2026-08-17',
          status: 'DRAFT',
          items: [plannedOil],
          totalEstimatedCost: 10000,
        },
        warnings: [],
        readiness: { productsPlanned: 1, productsRequired: 1, canConfirm: true },
      },
    });
    superAdminService.confirmProcurementPlan.mockResolvedValue({
      data: {
        plan: {
          _id: 'plan-1',
          procurementDate: '2026-08-17',
          status: 'CONFIRMED',
          items: [plannedOil],
          totalEstimatedCost: 10000,
          confirmedAt: '2026-08-17T12:00:00.000Z',
        },
        warnings: [],
        readiness: { productsPlanned: 1, productsRequired: 1, canConfirm: true },
      },
    });
  });

  it('renders empty state and creates a draft from demand', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Procurement Plan' })).toBeInTheDocument();
    expect(await screen.findByText('No active procurement plan exists for this date.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Draft Plan' }));
    await waitFor(() => {
      expect(superAdminService.createProcurementPlan).toHaveBeenCalledWith('2026-08-17');
    });
    expect(await screen.findByText('Sunflower Oil')).toBeInTheDocument();
    expect(screen.getByText(/Required: 100/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose Supplier' })).toBeInTheDocument();
    expect(screen.queryByText(/send to supplier/i)).not.toBeInTheDocument();
  });

  it('highlights lowest price without auto-selecting and then selects a supplier', async () => {
    superAdminService.getProcurementPlanByDate.mockResolvedValue({
      data: {
        plan: {
          _id: 'plan-1',
          procurementDate: '2026-08-17',
          status: 'DRAFT',
          items: [oilItem],
          totalEstimatedCost: 0,
        },
        warnings: [],
        readiness: { productsPlanned: 0, productsRequired: 1, canConfirm: false },
      },
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Choose Supplier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose Supplier' }));
    expect(await screen.findByText('Lowest Price')).toBeInTheDocument();
    expect(screen.getByText('ABC Oils')).toBeInTheDocument();
    expect(screen.getByText('XYZ Distributors')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0]);
    await waitFor(() => {
      expect(superAdminService.updateProcurementPlan).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({
          items: [expect.objectContaining({ supplierId: 'sup-abc', supplierProductId: 'map-abc' })],
        })
      );
    });
  });

  it('shows confirmation dialog and makes the confirmed plan read-only', async () => {
    superAdminService.getProcurementPlanByDate.mockResolvedValue({
      data: {
        plan: {
          _id: 'plan-1',
          procurementDate: '2026-08-17',
          status: 'DRAFT',
          items: [plannedOil],
          totalEstimatedCost: 10000,
        },
        warnings: [],
        readiness: { productsPlanned: 1, productsRequired: 1, canConfirm: true },
      },
    });
    renderPage();
    expect(await screen.findByText('ABC Oils')).toBeInTheDocument();
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getAllByText('₹10000.00').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Plan' }));
    expect(screen.getByRole('heading', { name: 'Confirm Procurement Plan' })).toBeInTheDocument();
    expect(screen.getByText(/No supplier request will be sent yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Procurement Plan' }));
    await waitFor(() => expect(superAdminService.confirmProcurementPlan).toHaveBeenCalledWith('plan-1'));
    expect(await screen.findByText(/Confirmed plan is read-only/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Choose Supplier' })).not.toBeInTheDocument();
  });

  it('shows loading and error states', async () => {
    superAdminService.getProcurementPlanByDate.mockRejectedValue({
      response: { data: { message: 'Failed to load procurement plan' } },
    });
    renderPage();
    expect(screen.getByText('Loading procurement plan...')).toBeInTheDocument();
    expect(await screen.findByText('Failed to load procurement plan')).toBeInTheDocument();
  });
});
