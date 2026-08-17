import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Suppliers from './Suppliers';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    updateSupplierStatus: vi.fn(),
    getSupplierProducts: vi.fn(),
    createSupplierProduct: vi.fn(),
    updateSupplierProduct: vi.fn(),
    updateSupplierProductStatus: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const sampleSupplier = {
  _id: '64b000000000000000000001',
  supplierName: 'Sunrise Staples',
  companyName: 'Sunrise Staples Pvt Ltd',
  contactPerson: 'Asha Rao',
  phone: '9876501234',
  email: 'sunrise@example.com',
  businessAddress: '12 Market Road',
  gstNumber: '27AAPFU0939F1Z5',
  notes: 'Preferred supplier',
  status: 'PENDING',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/super-admin/suppliers']}>
    <Routes>
      <Route path="/super-admin/suppliers" element={<Suppliers />} />
    </Routes>
  </MemoryRouter>
);

describe('Super Admin Suppliers page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSuppliers.mockResolvedValue({
      data: { suppliers: [sampleSupplier], pages: 1, total: 1, page: 1 },
    });
    superAdminService.createSupplier.mockResolvedValue({ data: sampleSupplier });
    superAdminService.updateSupplier.mockResolvedValue({
      data: { ...sampleSupplier, contactPerson: 'Ravi Kumar' },
    });
    superAdminService.updateSupplierStatus.mockResolvedValue({
      data: { ...sampleSupplier, status: 'APPROVED' },
    });
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [], pages: 1, total: 0, page: 1 },
    });
  });

  it('loads the supplier list', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Suppliers' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Sunrise Staples')).toBeInTheDocument();
    });
    expect(screen.getByText('Sunrise Staples Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Supplier' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compare Suppliers' })).toBeInTheDocument();
  });

  it('shows validation messages on the add supplier form', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Sunrise Staples'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Supplier' }));
    expect(screen.getByRole('heading', { name: 'Add Supplier' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Supplier Name *'), { target: { value: ' ' } });
    fireEvent.change(screen.getByPlaceholderText('Company Name *'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByPlaceholderText('Phone Number *'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(await screen.findByText(/Supplier name is required|Phone must be 10 digits/i)).toBeInTheDocument();
    expect(superAdminService.createSupplier).not.toHaveBeenCalled();
  });

  it('creates a supplier from the add form', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Sunrise Staples'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Supplier' }));
    fireEvent.change(screen.getByPlaceholderText('Supplier Name *'), { target: { value: 'New Supplier' } });
    fireEvent.change(screen.getByPlaceholderText('Company Name *'), { target: { value: 'New Co' } });
    fireEvent.change(screen.getByPlaceholderText('Phone Number *'), { target: { value: '9876509999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Supplier' }));

    await waitFor(() => {
      expect(superAdminService.createSupplier).toHaveBeenCalledWith(expect.objectContaining({
        supplierName: 'New Supplier',
        companyName: 'New Co',
        phone: '9876509999',
      }));
    });
  });

  it('edits a supplier', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Sunrise Staples'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('Contact Person'), { target: { value: 'Ravi Kumar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(superAdminService.updateSupplier).toHaveBeenCalledWith(
        sampleSupplier._id,
        expect.objectContaining({ contactPerson: 'Ravi Kumar' })
      );
    });
  });

  it('runs status actions and opens the detail view', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Sunrise Staples'));

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await waitFor(() => {
      expect(superAdminService.updateSupplierStatus).toHaveBeenCalledWith(sampleSupplier._id, 'APPROVED');
    });

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(screen.getByRole('heading', { name: 'Supplier Details' })).toBeInTheDocument();
    expect(screen.getByText(/Preferred supplier/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
  });

  it('shows Products tab and blocks add mapping for a pending supplier', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Sunrise Staples'));
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(superAdminService.getSupplierProducts).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Add Product' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only active suppliers can receive new product mappings/i)).toBeInTheDocument();
  });

  it('shows an error when the list fails to load', async () => {
    superAdminService.getSuppliers.mockRejectedValue({
      response: { data: { message: 'Failed to load suppliers' } },
    });
    renderPage();
    expect(await screen.findByText('Failed to load suppliers')).toBeInTheDocument();
  });
});
