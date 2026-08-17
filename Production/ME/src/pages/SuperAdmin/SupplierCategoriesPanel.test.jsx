import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SupplierCategoriesPanel from './SupplierCategoriesPanel';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getSupplierCategories: vi.fn(),
    createSupplierCategory: vi.fn(),
    updateSupplierCategoryStatus: vi.fn(),
    getCategories: vi.fn(),
  },
}));

const activeSupplier = {
  id: '64b000000000000000000001',
  supplierName: 'ABC Oils',
  rawStatus: 'ACTIVE',
  catalogSummary: { categoryCount: 1 },
};

const inactiveSupplier = {
  id: '64b000000000000000000002',
  supplierName: 'Inactive Oils',
  rawStatus: 'INACTIVE',
};

const sampleCategory = {
  _id: '64sc000000000000000001',
  categoryId: '64cat001',
  name: 'Cooking Oil',
  status: 'ACTIVE',
  productCount: 2,
};

describe('SupplierCategoriesPanel - Phase 4.2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [sampleCategory], total: 1 },
    });
    superAdminService.getCategories.mockResolvedValue({
      data: [
        { _id: '64cat001', name: 'Cooking Oil' },
        { _id: '64cat002', name: 'Edible Oils' },
      ],
    });
    superAdminService.createSupplierCategory.mockResolvedValue({ data: sampleCategory });
    superAdminService.updateSupplierCategoryStatus.mockResolvedValue({
      data: { ...sampleCategory, status: 'INACTIVE' },
    });
  });

  it('shows supplier category cards with status and product count', async () => {
    render(<SupplierCategoriesPanel supplier={activeSupplier} />);
    await waitFor(() => expect(screen.getByText('Cooking Oil')).toBeInTheDocument());
    expect(screen.getByText('Supplier Category')).toBeInTheDocument();
    expect(screen.getByText('2 Supplier Products')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Supplier Category' })).toBeInTheDocument();
  });

  it('associates an existing global category without creating a new one', async () => {
    const onCatalogChange = vi.fn();
    render(<SupplierCategoriesPanel supplier={activeSupplier} onCatalogChange={onCatalogChange} />);
    await waitFor(() => screen.getByText('Cooking Oil'));

    fireEvent.click(screen.getByRole('button', { name: 'Add Supplier Category' }));
    expect(screen.getByRole('heading', { name: 'Add Supplier Category' })).toBeInTheDocument();
    await waitFor(() => expect(superAdminService.getCategories).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Edible Oils' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Supplier Category' }).at(-1));

    await waitFor(() => {
      expect(superAdminService.createSupplierCategory).toHaveBeenCalledWith(
        activeSupplier.id,
        expect.objectContaining({ categoryId: '64cat002' })
      );
    });
    expect(onCatalogChange).toHaveBeenCalled();
  });

  it('blocks add category for inactive suppliers and supports deactivate', async () => {
    render(<SupplierCategoriesPanel supplier={inactiveSupplier} />);
    await waitFor(() => screen.getByText('Cooking Oil'));
    expect(screen.queryByRole('button', { name: 'Add Supplier Category' })).not.toBeInTheDocument();
    expect(screen.getByText(/Only ACTIVE suppliers can receive new supplier categories/i)).toBeInTheDocument();

    render(<SupplierCategoriesPanel supplier={activeSupplier} />);
    await waitFor(() => screen.getByText('Cooking Oil'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate' }).at(-1));
    await waitFor(() => {
      expect(superAdminService.updateSupplierCategoryStatus).toHaveBeenCalledWith(
        activeSupplier.id,
        sampleCategory._id,
        'INACTIVE'
      );
    });
  });

  it('shows empty and error states', async () => {
    superAdminService.getSupplierCategories.mockResolvedValue({
      data: { categories: [], total: 0 },
    });
    render(<SupplierCategoriesPanel supplier={activeSupplier} />);
    expect(await screen.findByText('No supplier categories configured.')).toBeInTheDocument();

    superAdminService.getSupplierCategories.mockRejectedValue({
      response: { data: { message: 'Unable to load supplier categories. Please try again.' } },
    });
    render(<SupplierCategoriesPanel supplier={activeSupplier} />);
    expect(await screen.findByText('Unable to load supplier categories. Please try again.')).toBeInTheDocument();
  });
});
