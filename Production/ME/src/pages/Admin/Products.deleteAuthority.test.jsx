import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Products from './Products';

const { getSupplierComparison } = vi.hoisted(() => ({ getSupplierComparison: vi.fn() }));
const deleteProduct = vi.fn();

vi.mock('../../services/productService', () => ({
  default: { getSupplierComparison },
}));

vi.mock('../../hooks/useProducts', () => ({
  default: () => ({
    products: [{ id: 'p1', name: 'Safe Product', sku: 'SAFE-1', category: 'Food', categoryId: 'c1', price: 100, gst: 5, stock: 5, status: 'active', bulkPricing: [] }],
    loading: false, saving: false, error: null, actionError: null, successMessage: null,
    createProduct: vi.fn(), updateProduct: vi.fn(), deleteProduct, clearMessages: vi.fn(),
  }),
}));

vi.mock('../../hooks/useCategories', () => ({
  default: () => ({ categories: [{ id: 'c1', name: 'Food' }], loading: false, error: null }),
}));

describe('product delete authority UX', () => {
  beforeEach(() => { deleteProduct.mockReset(); getSupplierComparison.mockReset(); vi.restoreAllMocks(); });

  it('shows editable GST and internal supplier prices in the shared product form', async () => {
    getSupplierComparison.mockResolvedValue({ suppliers: [{ mappingId: 'm1', supplierName: 'Supplier A', companyName: 'A Foods', currentSupplierPrice: 80, availabilityStatus: 'ACTIVE' }] });
    render(<Products />);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByLabelText('GST (%)')).toHaveValue(5);
    expect(await screen.findByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText(/₹80\.00/)).toBeInTheDocument();
  });

  it('keeps Edit visible but hides destructive action for Admin', () => {
    render(<Products />);
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.queryByTitle('Deactivate product')).not.toBeInTheDocument();
  });

  it('shows confirmation for Super Admin and cancel does not call the API', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Products canDelete />);
    fireEvent.click(screen.getByTitle('Deactivate product'));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Safe Product'));
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it('calls the destructive endpoint only after Super Admin confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteProduct.mockResolvedValue(true);
    render(<Products canDelete />);
    fireEvent.click(screen.getByTitle('Deactivate product'));
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith('p1'));
  });
});
