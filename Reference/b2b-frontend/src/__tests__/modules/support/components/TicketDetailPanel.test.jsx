import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TicketDetailPanel from '../../../../modules/support/components/TicketDetailPanel.jsx';

const ticket = {
  _id: '1',
  subject: 'Test Ticket',
  message: 'Need help with order',
  status: 'OPEN',
  userId: { name: 'User', email: 'user@test.com' },
  createdAt: new Date().toISOString(),
};

describe('TicketDetailPanel', () => {
  it('renders ticket details', () => {
    render(<TicketDetailPanel ticket={ticket} isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    expect(screen.getByText('Need help with order')).toBeInTheDocument();
  });
});
