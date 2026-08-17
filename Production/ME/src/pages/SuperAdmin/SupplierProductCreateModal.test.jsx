import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SupplierProductsCatalog from './SupplierProductsCatalog';
import SupplierProductCreateModal, { validateSupplierProductCreateForm } from './SupplierProductCreateModal';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSupplierProducts: vi.fn(),
    getSupplierCategories: vi.fn(),
    searchSupplierProducts: vi.fn(),
    createSupplierProduct: vi.fn(),
    updateSupplierProductStatus: vi.fn(),
    updateSupplierProductPrice: vi.fn(),
  },
}));

vi.mock('../../components/common/ImageUpload', () => ({
  default: ({ label }) => <div>{label}</div>,
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const activeSupplier = {
  id: '64b000000000000000000001',
  supplierName: 'ABC Oils',
  rawStatus: 'ACTIVE',
  catalogSummary: {
    productCount: 1,
    categoryCount: 1,
    pricesConfigured: 0,
    pricesNotSet: 1,
  },
};

const sampleMapping = {
  _id: '64map001',
  product: { name: 'Sunflower Oil', category: { _id: '64cat001', name: 'Cooking Oil' } },
  minimumOrderQuantity: 50,
  currentSupplierPrice: null,
  availabilityStatus: 'ACTIVE',
};

describe('SupplierProductsCatalog - Phase 4.3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [sampleMapping], total: 1, pages: 1, page: 1 },
    });
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: {
        categories: [{
          _id: '64sc001',
          categoryId: '64cat001',
          name: 'Cooking Oil',
          status: 'ACTIVE',
          productCount: 1,
        }],
        total: 1,
      },
    });
  });

  it('shows Create Supplier Product for an active supplier', async () => {
    render(<SupplierProductsCatalog supplier={activeSupplier} />);
    await waitFor(() => expect(screen.getByText('Sunflower Oil')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Create Supplier Product' })).toBeInTheDocument();
    expect(screen.getByText('Supplier Product')).toBeInTheDocument();
    expect(screen.getByText('Not Set ⚠')).toBeInTheDocument();
  });
});

describe('SupplierProductCreateModal - Phase 4.3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: {
        categories: [{
          _id: '64sc001',
          categoryId: '64cat001',
          name: 'Cooking Oil',
          status: 'ACTIVE',
        }],
        total: 1,
      },
    });
    superAdminService.searchSupplierProducts.mockResolvedValue({
      data: {
        products: [{
          _id: '64prod001',
          name: 'Sunflower Oil',
          isActive: true,
          category: { _id: '64cat001', name: 'Cooking Oil' },
          alreadyMapped: false,
        }],
      },
    });
    superAdminService.createSupplierProduct.mockResolvedValue({ data: sampleMapping });
  });

  it('shows locked supplier context and existing product search', async () => {
    render(
      <SupplierProductCreateModal
        isOpen
        onClose={vi.fn()}
        supplier={activeSupplier}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Supplier Product')).toBeInTheDocument();
    expect(screen.getByText('ABC Oils')).toBeInTheDocument();
    await waitFor(() => expect(superAdminService.getSupplierCategories).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Sunflower Oil')).toBeInTheDocument());
  });

  it('creates a supplier product from an existing product', async () => {
    const onSuccess = vi.fn();
    render(
      <SupplierProductCreateModal
        isOpen
        onClose={vi.fn()}
        supplier={activeSupplier}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => screen.getByText('Sunflower Oil'));
    fireEvent.click(screen.getByText('Sunflower Oil'));
    fireEvent.change(screen.getByPlaceholderText('50'), { target: { value: '50' } });
    fireEvent.change(screen.getByPlaceholderText('100.00'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier Product' }));

    await waitFor(() => {
      expect(superAdminService.createSupplierProduct).toHaveBeenCalledWith(
        activeSupplier.id,
        expect.objectContaining({
          productId: '64prod001',
          minimumOrderQuantity: 50,
          supplierPrice: 100,
        })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('validates supplier-specific form fields', () => {
    expect(validateSupplierProductCreateForm({
      mode: 'existing',
      selectedProduct: null,
      supplierCategoryId: '',
      supplierMoq: 0,
      supplierPrice: '',
    })).toMatch(/Select an existing product/i);

    expect(validateSupplierProductCreateForm({
      mode: 'new',
      selectedProduct: null,
      supplierCategoryId: '64sc001',
      supplierMoq: 10,
      supplierPrice: 100,
      productName: 'Rice',
      customerPrice: 200,
    })).toBe('');
  });
});
