import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierDetails from './SupplierDetails';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: { getSupplier: vi.fn() } }));

const renderPage = () => render(<MemoryRouter initialEntries={['/supplier-dashboard/suppliers/abc']}><Routes><Route path="/supplier-dashboard/suppliers/:supplierId" element={<SupplierDetails />} /></Routes></MemoryRouter>);

describe('Supplier Details', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders supplier summary and associated category product counts', async () => {
    superAdminService.getSupplier.mockResolvedValue({ data: {
      _id: 'abc', supplierName: 'Sunrise Staples', companyName: 'Sunrise Pvt Ltd', status: 'ACTIVE',
      contactPerson: 'Asha', phone: '9876501234', email: 'asha@example.com', businessAddress: 'Hyderabad',
      catalogSummary: { categoryCount: 1, productCount: 2 },
      categories: [{ _id: 'mapping-1', categoryId: 'cat-1', name: 'Rice & Grains', status: 'ACTIVE', productCount: 2 }],
    } });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Sunrise Staples' })).toBeInTheDocument();
    expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
    expect(screen.getByText('2 Supplier Products')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rice & Grains.*View Products/i })).toHaveAttribute(
      'href',
      '/supplier-dashboard/suppliers/abc/categories/cat-1'
    );
    expect(superAdminService.getSupplier).toHaveBeenCalledWith('abc');
  });

  it('renders a deterministic API error state', async () => {
    superAdminService.getSupplier.mockRejectedValue({ response: { status: 404, data: { message: 'Supplier not found' } } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Supplier not found');
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
