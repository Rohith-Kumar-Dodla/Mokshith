import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VendorCreditPage from '../../../../modules/credit/pages/VendorCreditPage.jsx';

vi.mock('../../../../modules/credit/hooks/useVendorCredit.js', () => ({
  useVendorCredit: () => ({
    account: { creditLimit: 500000, usedCredit: 185000, availableCredit: 315000, utilizationPercent: 37 },
    ledger: [{ _id: '1', type: 'DEBIT', amount: 25000, description: 'Test', createdAt: new Date().toISOString() }],
    summary: { totalDebits: 25000, totalCredits: 15000, transactionCount: 2 },
    loading: false,
    error: null,
  }),
}));

describe('VendorCreditPage', () => {
  it('renders credit dashboard', () => {
    render(<VendorCreditPage />);
    expect(screen.getByText('Credit Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Available Credit')).toBeInTheDocument();
    expect(screen.getByText('37%')).toBeInTheDocument();
  });
});
