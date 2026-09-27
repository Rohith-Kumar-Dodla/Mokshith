import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierProducts from './SupplierProducts';
import SupplierCategories from './SupplierCategories';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: { getSupplierProducts: vi.fn(), getSupplierCategories: vi.fn(), getCategories: vi.fn(), updateSupplierCategoryStatus: vi.fn(), createSupplierCategory: vi.fn() } }));

describe('Supplier management tables', () => {
  beforeEach(() => vi.clearAllMocks());
  it('renders supplier quantity and procurement price in a semantic product table', async () => {
    superAdminService.getSupplierProducts.mockResolvedValue({ mappings: [{ _id: 'm1', quantity: 485, currentSupplierPrice: 200, availabilityStatus: 'ACTIVE', product: { name: 'Sona Masoori Rice', sku: 'RICE-1', categoryId: 'c1', category: { name: 'Rice & Grains' } } }], page: 1, pages: 1 });
    render(<MemoryRouter initialEntries={['/supplier-dashboard/suppliers/s1/products']}><Routes><Route path="/supplier-dashboard/suppliers/:supplierId/products" element={<SupplierProducts/>}/></Routes></MemoryRouter>);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('485')).toBeInTheDocument();
    expect(screen.getByText('₹200.00')).toBeInTheDocument();
  });
  it('renders supplier categories in a semantic table', async () => {
    superAdminService.getSupplierCategories.mockResolvedValue({ supplier: { supplierName: 'Sunrise', status: 'ACTIVE' }, categories: [{ _id: 'sc1', categoryId: 'c1', name: 'Rice & Grains', productCount: 2, status: 'ACTIVE' }], page: 1, pages: 1 });
    render(<MemoryRouter initialEntries={['/supplier-dashboard/suppliers/s1/categories']}><Routes><Route path="/supplier-dashboard/suppliers/:supplierId/categories" element={<SupplierCategories/>}/></Routes></MemoryRouter>);
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Supplier Products' })).toBeInTheDocument();
  });
});
