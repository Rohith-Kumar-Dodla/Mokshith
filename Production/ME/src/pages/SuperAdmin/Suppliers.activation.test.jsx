import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Suppliers from './Suppliers';
import SupplierProductsCatalog from './SupplierProductsCatalog';
import SupplierCategoriesPanel from './SupplierCategoriesPanel';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSuppliers: vi.fn(),
    getSupplier: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    updateSupplierStatus: vi.fn(),
    getSupplierProducts: vi.fn(),
    getSupplierCategories: vi.fn(),
    createSupplierCategory: vi.fn(),
    createSupplierProduct: vi.fn(),
    searchSupplierProducts: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const buildSupplier = (status) => ({
  _id: '64b000000000000000000001',
  supplierName: 'Ranjith',
  companyName: 'Ranjith General Stores',
  contactPerson: 'Ranjith',
  phone: '9876501234',
  email: 'ranjith@example.com',
  businessAddress: '12 Market Road',
  gstNumber: '27AAPFU0939F1Z5',
  notes: '',
  status,
  catalogSummary: {
    productCount: 0,
    categoryCount: 0,
    pricesConfigured: 0,
    pricesNotSet: 0,
    activeProductCount: 0,
    activeCategoryCount: 0,
  },
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

const renderPage = (status = 'APPROVED') => {
  const supplier = buildSupplier(status);
  superAdminService.getSuppliers.mockResolvedValue({
    data: { suppliers: [supplier], pages: 1, total: 1, page: 1 },
  });
  superAdminService.getSupplier.mockResolvedValue({ data: supplier });
  return render(
    <MemoryRouter initialEntries={['/super-admin/suppliers']}>
      <Routes>
        <Route path="/super-admin/suppliers" element={<Suppliers />} />
      </Routes>
    </MemoryRouter>
  );
};

const openSupplierDetails = async () => {
  await waitFor(() => screen.getAllByText('Ranjith'));
  fireEvent.click(screen.getByRole('button', { name: 'View' }));
  expect(screen.getByRole('heading', { name: 'Supplier Details' })).toBeInTheDocument();
};

describe('Supplier catalog activation UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [], pages: 1, total: 0, page: 1 },
    });
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [], total: 0 },
    });
    superAdminService.updateSupplierStatus.mockImplementation((_id, status) => Promise.resolve({
      data: { ...buildSupplier(status), status },
    }));
    superAdminService.getSupplier.mockImplementation(() => Promise.resolve({
      data: buildSupplier('ACTIVE'),
    }));
  });

  it('shows activation guidance for an APPROVED supplier on overview and tabs', async () => {
    renderPage('APPROVED');
    await openSupplierDetails();

    expect(screen.getByText(/Supplier is approved but not active/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Activate Supplier' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(superAdminService.getSupplierProducts).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Create Supplier Product' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only ACTIVE suppliers can receive new supplier products/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    await waitFor(() => expect(superAdminService.getSupplierCategories).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Add Supplier Category' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only ACTIVE suppliers can receive new supplier categories/i)).toBeInTheDocument();
  });

  it('shows create actions for an ACTIVE supplier', async () => {
    superAdminService.getSuppliers.mockResolvedValue({
      data: { suppliers: [buildSupplier('ACTIVE')], pages: 1, total: 1, page: 1 },
    });
    superAdminService.getSupplier.mockResolvedValue({ data: buildSupplier('ACTIVE') });

    render(
      <MemoryRouter initialEntries={['/super-admin/suppliers']}>
        <Routes>
          <Route path="/super-admin/suppliers" element={<Suppliers />} />
        </Routes>
      </MemoryRouter>
    );
    await openSupplierDetails();

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create Supplier Product' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Supplier Category' })).toBeInTheDocument());
  });

  it('activates an APPROVED supplier and refreshes create actions', async () => {
    renderPage('APPROVED');
    await openSupplierDetails();

    superAdminService.getSupplier.mockResolvedValue({ data: buildSupplier('ACTIVE') });
    fireEvent.click(screen.getAllByRole('button', { name: 'Activate Supplier' })[0]);

    await waitFor(() => {
      expect(superAdminService.updateSupplierStatus).toHaveBeenCalledWith(
        '64b000000000000000000001',
        'ACTIVE'
      );
    });
    await waitFor(() => expect(superAdminService.getSupplier).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    expect(await screen.findByRole('button', { name: 'Create Supplier Product' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    expect(await screen.findByRole('button', { name: 'Add Supplier Category' })).toBeInTheDocument();
  });

  it('shows approval guidance for a PENDING supplier without activate action on catalog tabs', async () => {
    renderPage('PENDING');
    await openSupplierDetails();

    expect(screen.getByText(/pending approval/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve Supplier' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(superAdminService.getSupplierProducts).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Create Supplier Product' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activate Supplier' })).not.toBeInTheDocument();
  });

  it('shows activation guidance for an INACTIVE supplier', async () => {
    renderPage('INACTIVE');
    await openSupplierDetails();

    expect(screen.getByText(/supplier is inactive/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Activate Supplier' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    expect(screen.queryByRole('button', { name: 'Create Supplier Product' })).not.toBeInTheDocument();
  });
});

describe('SupplierProductsCatalog activation banner', () => {
  it('calls onActivateSupplier from the products tab banner', async () => {
    const onActivateSupplier = vi.fn();
    render(
      <SupplierProductsCatalog
        supplier={{ id: '64b1', rawStatus: 'APPROVED', supplierName: 'Ranjith', catalogSummary: {} }}
        onActivateSupplier={onActivateSupplier}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Activate Supplier' }));
    expect(onActivateSupplier).toHaveBeenCalled();
  });
});

describe('SupplierCategoriesPanel activation banner', () => {
  beforeEach(() => {
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [], total: 0 },
    });
  });

  it('calls onActivateSupplier from the categories tab banner', async () => {
    const onActivateSupplier = vi.fn();
    render(
      <SupplierCategoriesPanel
        supplier={{ id: '64b1', rawStatus: 'APPROVED', supplierName: 'Ranjith' }}
        onActivateSupplier={onActivateSupplier}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Activate Supplier' }));
    expect(onActivateSupplier).toHaveBeenCalled();
  });
});
