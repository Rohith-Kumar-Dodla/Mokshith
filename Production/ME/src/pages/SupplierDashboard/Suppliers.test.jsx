import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Suppliers from './Suppliers';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({ default: { getSuppliers: vi.fn() } }));

const supplier = {
  _id: 'supplier-1', supplierName: 'Sunrise Staples', companyName: 'Sunrise Pvt Ltd', status: 'ACTIVE',
  catalogSummary: { categoryCount: 4, productCount: 6 },
};

describe('Supplier Network', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSuppliers.mockResolvedValue({ data: { suppliers: [supplier], page: 1, pages: 1, total: 1 } });
  });

  it('renders real supplier card data and detail navigation', async () => {
    render(<MemoryRouter><Suppliers /></MemoryRouter>);
    expect(screen.getByLabelText('Loading suppliers')).toBeInTheDocument();
    expect(screen.queryByText('No suppliers found')).not.toBeInTheDocument();
    expect(await screen.findByText('Sunrise Staples')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Supplier/i })).toHaveAttribute('href', '/supplier-dashboard/suppliers/supplier-1');
  });

  it('requests server-side search and status filtering', async () => {
    render(<MemoryRouter><Suppliers /></MemoryRouter>);
    await screen.findByText('Sunrise Staples');
    fireEvent.change(screen.getByPlaceholderText('Search suppliers...'), { target: { value: 'Sunrise' } });
    await waitFor(() => expect(superAdminService.getSuppliers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Sunrise' })));
    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Active' }));
    await waitFor(() => expect(superAdminService.getSuppliers).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ACTIVE' })));
  });

  it('renders empty, error, retry, and refresh states correctly', async () => {
    superAdminService.getSuppliers.mockResolvedValueOnce({ data: { suppliers: [], pages: 1 } });
    const { rerender } = render(<MemoryRouter><Suppliers /></MemoryRouter>);
    expect(await screen.findByText('No suppliers found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    await waitFor(() => expect(superAdminService.getSuppliers).toHaveBeenCalledTimes(2));

    superAdminService.getSuppliers.mockRejectedValue(new Error('network failure'));
    rerender(<MemoryRouter><Suppliers /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach the server/i);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
