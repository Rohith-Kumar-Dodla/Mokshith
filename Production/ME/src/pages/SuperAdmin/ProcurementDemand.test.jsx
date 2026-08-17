import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProcurementDemand from './ProcurementDemand';
import superAdminService from '../../services/superAdminService';

vi.mock('../../services/superAdminService', () => ({
  default: {
    getProcurementDemand: vi.fn(),
  },
}));

vi.mock('../../hooks/useViewport', () => ({
  default: () => ({ isMobile: false, isTablet: false, isDesktop: true }),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/super-admin/procurement/demand']}>
    <Routes>
      <Route path="/super-admin/procurement/demand" element={<ProcurementDemand />} />
    </Routes>
  </MemoryRouter>
);

const demandPayload = {
  date: '2026-08-17',
  orderCount: 3,
  productCount: 3,
  products: [
    { productId: 'p1', productName: 'Rice', requiredQuantity: 150, orderCount: 2 },
    { productId: 'p2', productName: 'Sugar', requiredQuantity: 20, orderCount: 1 },
    { productId: 'p3', productName: 'Sunflower Oil', requiredQuantity: 100, orderCount: 3 },
  ],
};

describe('Procurement demand page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    superAdminService.getProcurementDemand.mockResolvedValue({ data: demandPayload });
  });

  it('renders demand summary and product table', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Procurement Demand' })).toBeInTheDocument();
    expect(screen.getByLabelText('Procurement date')).toBeInTheDocument();
    expect(screen.getByText('Loading procurement demand...')).toBeInTheDocument();

    await waitFor(() => expect(superAdminService.getProcurementDemand).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Plan Procurement' })).toBeInTheDocument();
    expect(screen.getByText("Today's Orders")).toBeInTheDocument();
    expect(screen.getByText('Products Required')).toBeInTheDocument();
    expect(screen.getByText('Sunflower Oil')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Rice')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.queryByText(/select supplier/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/purchase request/i)).not.toBeInTheDocument();
  });

  it('reloads when the date changes', async () => {
    renderPage();
    await waitFor(() => expect(superAdminService.getProcurementDemand).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Procurement date'), { target: { value: '2026-08-16' } });
    await waitFor(() => {
      expect(superAdminService.getProcurementDemand).toHaveBeenCalledWith({ date: '2026-08-16' });
    });
  });

  it('shows an empty state when there is no demand', async () => {
    superAdminService.getProcurementDemand.mockResolvedValue({
      data: { date: '2026-08-17', orderCount: 0, productCount: 0, products: [] },
    });
    renderPage();
    expect(await screen.findByText('No procurement demand for this date.')).toBeInTheDocument();
    expect(screen.getByText("Today's Orders")).toBeInTheDocument();
  });

  it('shows an error state', async () => {
    superAdminService.getProcurementDemand.mockRejectedValue({
      response: { data: { message: 'Failed to load procurement demand' } },
    });
    renderPage();
    expect(await screen.findByText('Failed to load procurement demand')).toBeInTheDocument();
  });
});
