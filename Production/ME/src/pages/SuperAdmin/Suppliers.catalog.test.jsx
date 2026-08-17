import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Suppliers from './Suppliers';
import SupplierProductsCatalog from './SupplierProductsCatalog';
import { formatSupplierPrice } from './SupplierProductsCatalog.utils';
import SupplierCategoriesPanel from './SupplierCategoriesPanel';
import SupplierSummaryCard from './SupplierSummaryCard';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSuppliers: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    updateSupplierStatus: vi.fn(),
    getSupplierProducts: vi.fn(),
    getSupplierCategories: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const sampleSummary = {
  productCount: 12,
  categoryCount: 4,
  pricesConfigured: 10,
  pricesNotSet: 2,
  activeProductCount: 11,
};

const sampleSupplier = {
  _id: '64b000000000000000000001',
  supplierName: 'ABC Oils',
  companyName: 'ABC Oils Pvt Ltd',
  contactPerson: 'Asha Rao',
  phone: '9876501234',
  email: 'abc@example.com',
  businessAddress: '12 Market Road',
  gstNumber: '27AAPFU0939F1Z5',
  notes: 'Preferred supplier',
  status: 'ACTIVE',
  catalogSummary: sampleSummary,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const sampleMapping = {
  _id: '64b0000000000000000000aa',
  productId: '64b0000000000000000000bb',
  product: {
    _id: '64b0000000000000000000bb',
    name: 'Sunflower Oil',
    categoryId: '64cat001',
    category: { _id: '64cat001', name: 'Cooking Oil' },
  },
  minimumOrderQuantity: 50,
  currentSupplierPrice: null,
  availabilityStatus: 'ACTIVE',
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/super-admin/suppliers']}>
    <Routes>
      <Route path="/super-admin/suppliers" element={<Suppliers />} />
    </Routes>
  </MemoryRouter>
);

describe('Super Admin supplier catalog overview - Phase 4.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSuppliers.mockResolvedValue({
      data: { suppliers: [sampleSupplier], pages: 1, total: 1, page: 1 },
    });
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [sampleMapping], pages: 1, total: 1, page: 1 },
    });
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: {
        categories: [{
          _id: '64sc001',
          categoryId: '64cat001',
          name: 'Cooking Oil',
          status: 'ACTIVE',
          productCount: 5,
        }],
        total: 1,
      },
    });
  });

  it('renders supplier summary cards with counts', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText('ABC Oils').length).toBeGreaterThan(0));
    expect(screen.getByText('12 Supplier Products')).toBeInTheDocument();
    expect(screen.getByText('4 Supplier Categories')).toBeInTheDocument();
    expect(screen.getByText('10 Prices Configured')).toBeInTheDocument();
    expect(screen.getByText('2 Prices Not Set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View supplier ABC Oils' })).toBeInTheDocument();
  });

  it('opens supplier details from card and shows overview, products, and categories tabs', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('ABC Oils'));
    fireEvent.click(screen.getByRole('button', { name: 'View supplier ABC Oils' }));

    expect(screen.getByRole('heading', { name: 'Supplier Details' })).toBeInTheDocument();
    expect(screen.getAllByText('Products').length).toBeGreaterThan(0);
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Products' }));
    await waitFor(() => expect(superAdminService.getSupplierProducts).toHaveBeenCalled());
    expect(screen.getByText('Supplier Product')).toBeInTheDocument();
    expect(screen.getByText('Not Set ⚠')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Supplier Product' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Product' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    await waitFor(() => expect(superAdminService.getSupplierCategories).toHaveBeenCalled());
    expect(screen.getByText('Supplier Category')).toBeInTheDocument();
    expect(screen.getByText('Cooking Oil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Supplier Category' })).toBeInTheDocument();
  });

  it('navigates from category card to products tab with category filter', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('ABC Oils'));
    fireEvent.click(screen.getByRole('button', { name: 'View supplier ABC Oils' }));
    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    await waitFor(() => screen.getByText('View Products →'));
    fireEvent.click(screen.getByText('View Products →'));

    await waitFor(() => {
      expect(superAdminService.getSupplierProducts).toHaveBeenCalledWith(
        sampleSupplier._id,
        expect.objectContaining({ categoryId: '64cat001' })
      );
    });
  });

  it('shows loading and error states for supplier cards and catalog panels', async () => {
    superAdminService.getSuppliers.mockImplementation(
      () => new Promise(() => {})
    );
    const { container } = renderPage();
    expect(container.querySelector('.animate-pulse')).toBeTruthy();

    superAdminService.getSuppliers.mockRejectedValue({
      response: { data: { message: 'Failed to load suppliers' } },
    });
    renderPage();
    expect(await screen.findByText('Failed to load suppliers')).toBeInTheDocument();
  });
});

describe('SupplierProductsCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [sampleMapping], total: 1, pages: 1, page: 1 },
    });
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [{ categoryId: '64cat001', name: 'Cooking Oil', productCount: 1 }], total: 1 },
    });
  });

  it('shows supplier product label, MOQ, and empty state', async () => {
    render(
      <SupplierProductsCatalog
        supplier={{ id: sampleSupplier._id, catalogSummary: sampleSummary }}
      />
    );
    await waitFor(() => expect(screen.getByText('Sunflower Oil')).toBeInTheDocument());
    expect(screen.getByText('Supplier Product')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    superAdminService.getSupplierProducts.mockResolvedValue({
      data: { mappings: [], total: 0, pages: 1, page: 1 },
    });
    render(
      <SupplierProductsCatalog
        supplier={{ id: sampleSupplier._id, catalogSummary: sampleSummary }}
      />
    );
    expect(await screen.findByText('No supplier products configured.')).toBeInTheDocument();
  });
});

describe('SupplierCategoriesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [], total: 0 },
    });
  });

  it('shows empty categories state and error state', async () => {
    render(<SupplierCategoriesPanel supplier={{ id: sampleSupplier._id }} />);
    expect(await screen.findByText('No supplier categories configured.')).toBeInTheDocument();

    superAdminService.getSupplierCategories.mockRejectedValue({
      response: { data: { message: 'Unable to load supplier categories. Please try again.' } },
    });
    render(<SupplierCategoriesPanel supplier={{ id: sampleSupplier._id }} />);
    expect(await screen.findByText('Unable to load supplier categories. Please try again.')).toBeInTheDocument();
  });
});

describe('SupplierSummaryCard', () => {
  it('renders supplier status and loading skeleton', () => {
    render(
      <SupplierSummaryCard
        supplier={{
          supplierName: 'ABC Oils',
          companyName: 'ABC Oils Pvt Ltd',
          status: 'active',
          catalogSummary: sampleSummary,
        }}
        onView={vi.fn()}
      />
    );
    expect(screen.getByText('ABC Oils')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    render(<SupplierSummaryCard supplier={{}} loading />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});
