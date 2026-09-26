import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SupplierDashboardComingSoon from './ComingSoon';

describe('SupplierDashboardComingSoon', () => {
  it('renders the dashboard foundation without fake supplier metrics', () => {
    render(<SupplierDashboardComingSoon />);
    expect(screen.getByRole('heading', { name: 'Supplier Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByText(/Total Suppliers/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Total Products/i)).not.toBeInTheDocument();
  });

  it('renders lightweight route placeholders', () => {
    render(<SupplierDashboardComingSoon title="Products" description="Supplier product management will be available here." />);
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByText('Supplier product management will be available here.')).toBeInTheDocument();
  });
});
