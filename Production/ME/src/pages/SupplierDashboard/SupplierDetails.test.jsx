import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierDetails from './SupplierDetails';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: { getSupplier: vi.fn(), updateSupplier: vi.fn() } }));

const renderPage = () => render(<MemoryRouter initialEntries={['/supplier-dashboard/suppliers/abc']}><Routes><Route path="/supplier-dashboard/suppliers/:supplierId" element={<SupplierDetails />} /></Routes></MemoryRouter>);

describe('Supplier Details', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders supplier summary and associated category product counts', async () => {
    superAdminService.getSupplier.mockResolvedValue({ data: {
      _id: 'abc', supplierName: 'Sunrise Staples', companyName: 'Sunrise Pvt Ltd', status: 'ACTIVE',
      contactPerson: 'Asha', phone: '9876501234', email: 'asha@example.com', businessAddress: 'Hyderabad',
      catalogSummary: { categoryCount: 1, productCount: 2 },
      categories: [{ _id: '64b000000000000000000001', supplierCategoryId: '64b000000000000000000001', categoryId: '64c000000000000000000002', name: 'Rice & Grains', status: 'ACTIVE', productCount: 2 }],
    } });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Sunrise Staples' })).toBeInTheDocument();
    expect(screen.getByText('Rice & Grains')).toBeInTheDocument();
    expect(screen.getByText('2 Supplier Products')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rice & Grains.*View Products/i })).toHaveAttribute(
      'href',
      '/supplier-dashboard/suppliers/abc/categories/64c000000000000000000002'
    );
    expect(superAdminService.getSupplier).toHaveBeenCalledWith('abc');
  });

  it('renders a deterministic API error state', async () => {
    superAdminService.getSupplier.mockRejectedValue({ response: { status: 404, data: { message: 'Supplier not found' } } });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Supplier not found');
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('edits supplier information through the existing update API', async () => {
    superAdminService.getSupplier.mockResolvedValue({ data: { _id: 'abc', supplierName: 'Sunrise Staples', companyName: 'Sunrise Pvt Ltd', status: 'ACTIVE', contactPerson: 'Asha', phone: '9876501234', email: 'asha@example.com', businessAddress: 'Hyderabad', catalogSummary: {}, categories: [] } });
    superAdminService.updateSupplier.mockResolvedValue({ data: {} });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText('Contact person'), { target: { value: 'Anita' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(superAdminService.updateSupplier).toHaveBeenCalledWith('abc', expect.objectContaining({ contactPerson: 'Anita', phone: '9876501234' })));
  });

  it('validates supplier phone before submission', async () => {
    superAdminService.getSupplier.mockResolvedValue({ data: { _id: 'abc', supplierName: 'Sunrise Staples', companyName: 'Sunrise Pvt Ltd', status: 'ACTIVE', phone: '9876501234', catalogSummary: {}, categories: [] } });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('exactly 10 digits');
    expect(superAdminService.updateSupplier).not.toHaveBeenCalled();
  });
});
