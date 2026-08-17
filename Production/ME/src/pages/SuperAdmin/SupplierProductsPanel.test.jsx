import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SupplierProductsPanel from './SupplierProductsPanel';
import superAdminService from '../../services/superAdminService';
import productService from '../../services/productService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSupplierProducts: vi.fn(),
    createSupplierProduct: vi.fn(),
    updateSupplierProduct: vi.fn(),
    updateSupplierProductStatus: vi.fn(),
    updateSupplierProductPrice: vi.fn(),
    getSupplierProductPriceHistory: vi.fn(),
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

const activeSupplier = {
  id: '64b000000000000000000001',
  supplierName: 'ABC Oils',
  rawStatus: 'ACTIVE',
};

const inactiveSupplier = {
  id: '64b000000000000000000002',
  supplierName: 'Inactive Oils',
  rawStatus: 'INACTIVE',
};

const sampleMapping = {
  _id: '64b0000000000000000000aa',
  productId: '64b0000000000000000000bb',
  product: { _id: '64b0000000000000000000bb', name: 'Sunflower Oil' },
  minimumOrderQuantity: 50,
  currentSupplierPrice: null,
  availabilityStatus: 'ACTIVE',
  notes: 'Available regularly',
  createdAt: '2026-08-01T00:00:00.000Z',
};

const pricedMapping = {
  ...sampleMapping,
  currentSupplierPrice: 100,
};

describe('Supplier products panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [sampleMapping], pages: 1, total: 1, page: 1 },
    });
    superAdminService.createSupplierProduct.mockResolvedValue({ data: sampleMapping });
    superAdminService.updateSupplierProduct.mockResolvedValue({
      data: { ...sampleMapping, minimumOrderQuantity: 20 },
    });
    superAdminService.updateSupplierProductStatus.mockResolvedValue({
      data: { ...sampleMapping, availabilityStatus: 'INACTIVE' },
    });
    superAdminService.updateSupplierProductPrice.mockResolvedValue({
      data: { ...sampleMapping, currentSupplierPrice: 100 },
    });
    superAdminService.getSupplierProductPriceHistory.mockResolvedValue({
      data: {
        history: [
          {
            _id: 'h1',
            price: 100,
            previousPrice: null,
            changedAt: '2026-08-17T00:00:00.000Z',
          },
        ],
      },
    });
    productService.getAllProducts.mockResolvedValue({
      data: { products: [{ _id: '64b0000000000000000000cc', name: 'Groundnut Oil' }] },
    });
  });

  it('shows mapped products and Add Product for an active supplier', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    expect(screen.getByText('Supplier Products')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Sunflower Oil')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('does not allow new mappings for an inactive supplier', async () => {
    render(<SupplierProductsPanel supplier={inactiveSupplier} />);
    await waitFor(() => expect(screen.getByText('Sunflower Oil')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Add Product' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only active suppliers can receive new product mappings/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set Price' })).not.toBeInTheDocument();
  });

  it('loads existing products in the selector and creates a mapping', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Product' }));
    expect(screen.getByRole('heading', { name: 'Add Supplier Product' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search existing products...'), {
      target: { value: 'Groundnut' },
    });

    await waitFor(() => expect(productService.getAllProducts).toHaveBeenCalled());
    await waitFor(() => screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.change(screen.getByPlaceholderText('50'), { target: { value: '20' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Product' }).at(-1));

    await waitFor(() => {
      expect(superAdminService.createSupplierProduct).toHaveBeenCalledWith(
        activeSupplier.id,
        expect.objectContaining({
          productId: '64b0000000000000000000cc',
          minimumOrderQuantity: 20,
        })
      );
    });
  });

  it('shows a user-friendly duplicate mapping error', async () => {
    superAdminService.createSupplierProduct.mockRejectedValue({
      response: {
        status: 400,
        data: { message: 'This product is already mapped to this supplier.' },
      },
    });
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Product' }));
    await waitFor(() => screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.change(screen.getByPlaceholderText('50'), { target: { value: '10' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Product' }).at(-1));

    expect(await screen.findByText('This product is already mapped to this supplier.')).toBeInTheDocument();
  });

  it('edits mapping MOQ and notes', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('50'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(superAdminService.updateSupplierProduct).toHaveBeenCalledWith(
        activeSupplier.id,
        sampleMapping._id,
        expect.objectContaining({ minimumOrderQuantity: 20 })
      );
    });
  });

  it('activates and deactivates mappings and opens detail view', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => {
      expect(superAdminService.updateSupplierProductStatus).toHaveBeenCalledWith(
        activeSupplier.id,
        sampleMapping._id,
        'INACTIVE'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('heading', { name: 'Supplier Product Details' })).toBeInTheDocument();
    expect(screen.getByText(/Available regularly/)).toBeInTheDocument();
    expect(screen.getByText(/Supplier Price:/)).toBeInTheDocument();
  });

  it('sets supplier purchase price from the Set Price action', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Set Price' }));
    expect(screen.getByRole('heading', { name: 'Set Supplier Price' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('100.00'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Price' }));

    await waitFor(() => {
      expect(superAdminService.updateSupplierProductPrice).toHaveBeenCalledWith(
        activeSupplier.id,
        sampleMapping._id,
        100
      );
    });
  });

  it('shows formatted supplier price and opens read-only price history', async () => {
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [pricedMapping], pages: 1, total: 1, page: 1 },
    });
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => expect(screen.getByText('₹100.00')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Update Price' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Price History' }));
    expect(await screen.findByRole('heading', { name: 'Supplier Price History' })).toBeInTheDocument();
    expect(superAdminService.getSupplierProductPriceHistory).toHaveBeenCalledWith(
      activeSupplier.id,
      pricedMapping._id
    );
    expect(screen.getAllByText('₹100.00').length).toBeGreaterThanOrEqual(1);
  });

  it('validates MOQ before submit', async () => {
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Sunflower Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Product' }));
    await waitFor(() => screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Groundnut Oil' }));
    fireEvent.change(screen.getByPlaceholderText('50'), { target: { value: '0' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Product' }).at(-1));

    expect(await screen.findByText('Minimum order quantity must be a positive number.')).toBeInTheDocument();
    expect(superAdminService.createSupplierProduct).not.toHaveBeenCalled();
  });

  it('shows loading and error states', async () => {
    superAdminService.getSupplierProducts.mockRejectedValue({
      response: { data: { message: 'Failed to load supplier products' } },
    });
    render(<SupplierProductsPanel supplier={activeSupplier} />);
    expect(screen.getByText('Loading supplier products...')).toBeInTheDocument();
    expect(await screen.findByText('Failed to load supplier products')).toBeInTheDocument();
  });
});
