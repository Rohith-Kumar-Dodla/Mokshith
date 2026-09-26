import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierCategoryProducts from './SupplierCategoryProducts';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: {
  getSupplierCategoryProducts: vi.fn(),
  searchSupplierProducts: vi.fn(),
  createSupplierCategoryProduct: vi.fn(),
  updateSupplierCategoryProduct: vi.fn(),
  removeSupplierCategoryProduct: vi.fn(),
  updateSupplierProduct: vi.fn(),
  updateSupplierProductPrice: vi.fn(),
  removeSupplierProduct: vi.fn(),
} }));

const response = {
  data: {
    supplier: { _id: 'supplier-1', supplierName: 'Sunrise Staples', companyName: 'Sunrise Ltd', status: 'ACTIVE' },
    category: { _id: 'category-1', name: 'Rice & Grains', associationStatus: 'ACTIVE' },
    products: [{
      _id: 'mapping-1',
      product: { _id: 'product-1', name: 'Premium Rice', sku: 'RICE-1', categoryId: { _id: 'category-1', name: 'Rice & Grains' } },
      currentSupplierPrice: 42,
      minimumOrderQuantity: 10,
      availabilityStatus: 'ACTIVE',
    }],
    total: 1, page: 1, pages: 1,
  },
};

const renderPage = () => render(<MemoryRouter initialEntries={['/supplier-dashboard/suppliers/supplier-1/categories/category-1']}><Routes><Route path="/supplier-dashboard/suppliers/:supplierId/categories/:categoryId" element={<SupplierCategoryProducts />} /></Routes></MemoryRouter>);

describe('Supplier Category Products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierCategoryProducts.mockResolvedValue(response);
    superAdminService.searchSupplierProducts.mockResolvedValue({ data: { products: [{ _id: 'product-2', name: 'Brown Rice', sku: 'BR-2', alreadyMapped: false }] } });
    superAdminService.createSupplierCategoryProduct.mockResolvedValue({ data: {} });
    superAdminService.updateSupplierCategoryProduct.mockResolvedValue({ data: {} });
    superAdminService.removeSupplierCategoryProduct.mockResolvedValue({ data: {} });
    superAdminService.updateSupplierProduct.mockResolvedValue({ data: {} });
    superAdminService.updateSupplierProductPrice.mockResolvedValue({ data: {} });
    superAdminService.removeSupplierProduct.mockResolvedValue({ data: {} });
  });

  it('renders the supplier-scoped category and read-only product information', async () => {
    renderPage();
    expect(screen.getByLabelText('Loading supplier products')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Rice & Grains' })).toBeInTheDocument();
    expect(screen.getAllByText('Sunrise Staples')).not.toHaveLength(0);
    expect(screen.getByRole('article', { name: 'Premium Rice' })).toHaveTextContent('₹42');
    expect(screen.getByRole('article', { name: 'Premium Rice' })).toHaveTextContent('10');
    expect(screen.getByRole('article', { name: 'Premium Rice' })).toHaveTextContent('active');
    expect(screen.getByRole('link', { name: /Back to Supplier/i })).toHaveAttribute('href', '/supplier-dashboard/suppliers/supplier-1');
    expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('searches and adds an existing product in the locked supplier/category context', async () => {
    renderPage();
    await screen.findByText('Premium Rice');
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Product' }).at(-1));
    expect(screen.getByRole('heading', { name: 'Add Existing Product' })).toBeInTheDocument();
    expect(screen.getByLabelText('Supplier')).toHaveValue('Sunrise Staples');
    expect(screen.getByLabelText('Category')).toHaveValue('Rice & Grains');
    fireEvent.change(screen.getByPlaceholderText('Product name or SKU'), { target: { value: 'brown' } });
    await waitFor(() => expect(superAdminService.searchSupplierProducts).toHaveBeenLastCalledWith('supplier-1', expect.objectContaining({ search: 'brown', categoryId: 'category-1' })));
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: 'product-2' } });
    fireEvent.change(screen.getByLabelText('Supplier Price (₹)'), { target: { value: '55.5' } });
    fireEvent.change(screen.getByLabelText('MOQ'), { target: { value: '12' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Product' }).at(-1));
    await waitFor(() => expect(superAdminService.createSupplierCategoryProduct).toHaveBeenCalledWith('supplier-1', 'category-1', expect.objectContaining({ productId: 'product-2', supplierPrice: 55.5, minimumOrderQuantity: 12 })));
  });

  it('edits supplier fields and preserves product identity', async () => {
    renderPage(); await screen.findByText('Premium Rice');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Product')).toHaveValue('Premium Rice');
    fireEvent.change(screen.getByLabelText('MOQ'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Supplier Price (₹)'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(superAdminService.updateSupplierCategoryProduct).toHaveBeenCalledWith('supplier-1', 'category-1', 'mapping-1', expect.objectContaining({ minimumOrderQuantity: 20, supplierPrice: 50 })));
  });

  it('confirms safe removal and reports mutation failures without blanking the list', async () => {
    superAdminService.removeSupplierCategoryProduct.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Active allocation prevents removal' } } });
    renderPage(); await screen.findByText('Premium Rice');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByText(/global product will remain/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Product' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Active allocation/i);
    expect(screen.getByText('Premium Rice')).toBeInTheDocument();
  });

  it('sends scoped search and status filter parameters', async () => {
    renderPage();
    await screen.findByText('Premium Rice');
    fireEvent.change(screen.getByPlaceholderText('Search products...'), { target: { value: 'rice' } });
    await waitFor(() => expect(superAdminService.getSupplierCategoryProducts).toHaveBeenLastCalledWith('supplier-1', 'category-1', expect.objectContaining({ search: 'rice' })));
    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Inactive' }));
    await waitFor(() => expect(superAdminService.getSupplierCategoryProducts).toHaveBeenLastCalledWith('supplier-1', 'category-1', expect.objectContaining({ status: 'INACTIVE' })));
  });

  it('renders empty and error states with retry', async () => {
    superAdminService.getSupplierCategoryProducts.mockResolvedValueOnce({ ...response, data: { ...response.data, products: [], total: 0 } });
    const view = renderPage();
    expect(await screen.findByText('No supplier products found')).toBeInTheDocument();
    view.unmount();

    superAdminService.getSupplierCategoryProducts.mockRejectedValue(new Error('network'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach the server/i);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
