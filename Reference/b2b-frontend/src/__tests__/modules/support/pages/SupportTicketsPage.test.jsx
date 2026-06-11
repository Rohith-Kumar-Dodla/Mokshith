import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SupportTicketsPage from '../../../../modules/support/pages/SupportTicketsPage.jsx';

vi.mock('../../../../modules/support/services/supportService.js', () => ({
  supportService: {
    getAllTickets: vi.fn().mockResolvedValue([
      { _id: '1', subject: 'Delivery Issue', status: 'OPEN', userId: { name: 'Customer' }, message: 'Help needed', createdAt: new Date().toISOString() },
    ]),
    createTicket: vi.fn(),
    updateTicketStatus: vi.fn(),
  },
}));

describe('SupportTicketsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders support tickets heading', async () => {
    render(<SupportTicketsPage />);
    expect(screen.getByText('Support Tickets')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Delivery Issue')).toBeInTheDocument();
    });
  });
});
