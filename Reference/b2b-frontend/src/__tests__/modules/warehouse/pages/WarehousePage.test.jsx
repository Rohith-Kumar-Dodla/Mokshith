import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WarehousePage from '../../../../modules/warehouse/pages/WarehousePage.jsx';

vi.mock('../../../../modules/warehouse/hooks/useWarehouse.js', () => ({
  useWarehouse: () => ({
    warehouses: [{ _id: 'wh-1', name: 'Bangalore Hub', city: 'Bangalore', state: 'Karnataka', capacity: 50000, currentLoad: 10000 }],
    loading: false,
    error: null,
    createWarehouse: vi.fn(),
    updateWarehouse: vi.fn(),
    deleteWarehouse: vi.fn(),
  }),
}));

describe('WarehousePage', () => {
  it('renders warehouse network heading', () => {
    render(<WarehousePage />);
    expect(screen.getByText('Warehouse Network')).toBeInTheDocument();
    expect(screen.getByText('Bangalore Hub')).toBeInTheDocument();
  });
});
