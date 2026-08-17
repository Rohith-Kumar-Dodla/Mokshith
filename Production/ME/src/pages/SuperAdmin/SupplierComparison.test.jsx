import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierComparison, { comparisonEmptyMessage } from './SupplierComparison';
import superAdminService from '../../services/superAdminService';
import productService from '../../services/productService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSupplierComparison: vi.fn(),
  },
}));

vi.mock('../../services/productService', () => ({
  default: {
    getAllProducts: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/super-admin/suppliers/comparison']}>
    <Routes>
      <Route path="/super-admin/suppliers/comparison" element={<SupplierComparison />} />
      <Route path="/super-admin/suppliers" element={<div>Suppliers list</div>} />
    </Routes>
  </MemoryRouter>
);

const comparisonPayload = {
  product: { _id: 'prod-1', name: 'Sunflower Oil' },
  lowestPrice: 100,
  emptyReason: null,
  suppliers: [
    {
      supplierId: 's1',
      supplierName: 'ABC Oils',
      companyName: 'ABC Oils Pvt Ltd',
      minimumOrderQuantity: 50,
      currentSupplierPrice: 100,
      availabilityStatus: 'ACTIVE',
      isLowestPrice: true,
    },
    {
      supplierId: 's2',
      supplierName: 'PQR Traders',
      companyName: 'PQR Traders Pvt Ltd',
      minimumOrderQuantity: 30,
      currentSupplierPrice: 105,
      availabilityStatus: 'ACTIVE',
      isLowestPrice: false,
    },
  ],
};

describe('Supplier comparison page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productService.getAllProducts.mockResolvedValue({
      data: { products: [{ _id: 'prod-1', name: 'Sunflower Oil' }] },
    });
    superAdminService.getSupplierComparison.mockResolvedValue({ data: comparisonPayload });
  });

  it('renders the comparison page and product search', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Supplier Comparison' })).toBeInTheDocument();
    expect(screen.getByText(/does not select a supplier/i)).toBeInTheDocument();
    expect(screen.getByText('Search and select a product to compare suppliers.')).toBeInTheDocument();
    await waitFor(() => expect(productService.getAllProducts).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Sunflower Oil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select supplier/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /use this supplier/i })).not.toBeInTheDocument();
  });

  it('loads suppliers after selecting a product and highlights the lowest price', async () => {
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Sunflower Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));

    await waitFor(() => {
      expect(superAdminService.getSupplierComparison).toHaveBeenCalledWith('prod-1');
    });
    expect((await screen.findAllByText('ABC Oils')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('PQR Traders')).toBeInTheDocument();
    expect(screen.getAllByText('₹100.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('₹105.00')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Lowest Price')).toBeInTheDocument();
    expect(screen.getByText('Lowest Current Price')).toBeInTheDocument();
  });

  it('highlights equal lowest prices', async () => {
    superAdminService.getSupplierComparison.mockResolvedValue({
      data: {
        ...comparisonPayload,
        suppliers: [
          { ...comparisonPayload.suppliers[0], isLowestPrice: true },
          {
            supplierId: 's2',
            supplierName: 'PQR Traders',
            companyName: 'PQR Co',
            minimumOrderQuantity: 30,
            currentSupplierPrice: 100,
            availabilityStatus: 'ACTIVE',
            isLowestPrice: true,
          },
        ],
      },
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Sunflower Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    await waitFor(() => expect(screen.getAllByText('Lowest Price')).toHaveLength(2));
  });

  it('shows price-not-set suppliers without claiming a best price', async () => {
    superAdminService.getSupplierComparison.mockResolvedValue({
      data: {
        product: { _id: 'prod-1', name: 'Sunflower Oil' },
        lowestPrice: null,
        emptyReason: 'NO_PRICES',
        suppliers: [
          {
            supplierId: 's3',
            supplierName: 'No Price Oils',
            companyName: 'No Price Co',
            minimumOrderQuantity: 40,
            currentSupplierPrice: null,
            availabilityStatus: 'ACTIVE',
            isLowestPrice: false,
          },
        ],
      },
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Sunflower Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    expect(await screen.findByText('Supplier prices have not been configured yet.')).toBeInTheDocument();
    expect(screen.getByText('No Price Oils')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.queryByText('Lowest Current Price')).not.toBeInTheDocument();
  });

  it('shows no-mappings and no-active empty states', async () => {
    superAdminService.getSupplierComparison.mockResolvedValue({
      data: {
        product: { _id: 'prod-1', name: 'Sunflower Oil' },
        suppliers: [],
        lowestPrice: null,
        emptyReason: 'NO_MAPPINGS',
      },
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Sunflower Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    expect(await screen.findByText('No suppliers are mapped to this product yet.')).toBeInTheDocument();

    superAdminService.getSupplierComparison.mockResolvedValue({
      data: {
        product: { _id: 'prod-1', name: 'Sunflower Oil' },
        suppliers: [],
        lowestPrice: null,
        emptyReason: 'NO_ACTIVE_SUPPLIERS',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    expect(await screen.findByText('No active suppliers are currently available for this product.')).toBeInTheDocument();
  });

  it('shows loading and error states', async () => {
    let resolveComparison;
    superAdminService.getSupplierComparison.mockReturnValue(new Promise((resolve) => {
      resolveComparison = resolve;
    }));
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: 'Sunflower Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    expect(screen.getByText('Loading supplier comparison...')).toBeInTheDocument();
    resolveComparison({ data: comparisonPayload });
    await waitFor(() => expect(screen.getAllByText('ABC Oils').length).toBeGreaterThanOrEqual(1));

    superAdminService.getSupplierComparison.mockRejectedValue({
      response: { data: { message: 'Failed to load supplier comparison' } },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sunflower Oil' }));
    expect(await screen.findByText('Failed to load supplier comparison')).toBeInTheDocument();
  });

  it('maps empty reasons to user-facing copy', () => {
    expect(comparisonEmptyMessage('NO_MAPPINGS')).toBe('No suppliers are mapped to this product yet.');
    expect(comparisonEmptyMessage('NO_ACTIVE_SUPPLIERS')).toBe('No active suppliers are currently available for this product.');
    expect(comparisonEmptyMessage('NO_PRICES')).toBe('Supplier prices have not been configured yet.');
    expect(comparisonEmptyMessage(null)).toBe('');
  });
});
