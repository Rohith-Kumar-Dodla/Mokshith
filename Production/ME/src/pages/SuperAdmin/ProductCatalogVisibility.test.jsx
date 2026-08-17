import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SupplierProductsCatalog from './SupplierProductsCatalog';
import useProducts from '../../hooks/useProducts';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSupplierProducts: vi.fn(),
    getSupplierCategories: vi.fn(),
  },
}));

vi.mock('../../hooks/useProducts', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const activeSupplier = {
  id: 'supplier-1',
  name: 'ABC Oils',
  rawStatus: 'ACTIVE',
};

describe('Product catalog visibility - frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierCategories.mockResolvedValue({ data: { categories: [] } });
  });

  it('displays supplier-only product with Supplier Only Product label', async () => {
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: {
        mappings: [{
          _id: 'm1',
          minimumOrderQuantity: 40,
          currentSupplierPrice: 120,
          availabilityStatus: 'ACTIVE',
          product: {
            name: 'Groundnut Oil',
            catalogScope: 'SUPPLIER_ONLY',
          },
        }],
        total: 1,
      },
    });

    render(<SupplierProductsCatalog supplier={activeSupplier} />);

    expect(await screen.findByText('Groundnut Oil')).toBeInTheDocument();
    expect(screen.getByText('Supplier Only Product')).toBeInTheDocument();
  });

  it('displays attached existing product with Supplier Product label', async () => {
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: {
        mappings: [{
          _id: 'm2',
          minimumOrderQuantity: 50,
          currentSupplierPrice: 100,
          availabilityStatus: 'ACTIVE',
          product: {
            name: 'Sunflower Oil',
            catalogScope: 'CUSTOMER',
          },
        }],
        total: 1,
      },
    });

    render(<SupplierProductsCatalog supplier={activeSupplier} />);

    expect(await screen.findByText('Sunflower Oil')).toBeInTheDocument();
    expect(screen.getByText('Supplier Product')).toBeInTheDocument();
    expect(screen.queryByText('Supplier Only Product')).not.toBeInTheDocument();
  });

  it('does not render supplier-only products in vendor product hook results', async () => {
    useProducts.mockReturnValue({
      products: [{ _id: 'p1', name: 'Sunflower Oil', catalogScope: 'CUSTOMER' }],
      loading: false,
      error: '',
      refresh: vi.fn(),
    });

    const { products } = useProducts();
    expect(products.some((row) => row.catalogScope === 'SUPPLIER_ONLY')).toBe(false);
    expect(products.some((row) => row.name === 'Sunflower Oil')).toBe(true);
  });

  it('keeps supplier page functional with mixed catalog scopes', async () => {
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: {
        mappings: [
          {
            _id: 'm1',
            minimumOrderQuantity: 40,
            currentSupplierPrice: 120,
            availabilityStatus: 'ACTIVE',
            product: { name: 'Groundnut Oil', catalogScope: 'SUPPLIER_ONLY' },
          },
          {
            _id: 'm2',
            minimumOrderQuantity: 50,
            currentSupplierPrice: 100,
            availabilityStatus: 'ACTIVE',
            product: { name: 'Sunflower Oil', catalogScope: 'CUSTOMER' },
          },
        ],
        total: 2,
      },
    });

    render(<SupplierProductsCatalog supplier={activeSupplier} />);

    await waitFor(() => {
      expect(screen.getByText('Groundnut Oil')).toBeInTheDocument();
      expect(screen.getByText('Sunflower Oil')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Create Supplier Product' })).toBeInTheDocument();
  });
});
