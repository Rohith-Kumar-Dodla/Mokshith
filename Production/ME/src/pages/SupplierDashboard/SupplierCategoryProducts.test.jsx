import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierCategoryProducts from './SupplierCategoryProducts';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: { getSupplierCategoryProducts: vi.fn() } }));

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
    expect(screen.queryByRole('button', { name: /Add|Edit|Remove|Price|MOQ/i })).not.toBeInTheDocument();
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
