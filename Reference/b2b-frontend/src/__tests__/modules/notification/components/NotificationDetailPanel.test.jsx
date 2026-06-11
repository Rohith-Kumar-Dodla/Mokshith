import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationDetailPanel from '../../../../modules/notification/components/NotificationDetailPanel.jsx';

const notification = {
  _id: '1',
  title: 'Payment Received',
  message: 'Payment of ₹1000 received',
  type: 'PAYMENT',
  isRead: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationDetailPanel', () => {
  it('renders notification details', () => {
    render(<NotificationDetailPanel notification={notification} isOpen onClose={vi.fn()} onMarkRead={vi.fn()} />);
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Payment of ₹1000 received')).toBeInTheDocument();
  });

  it('calls onMarkRead when mark as read clicked', () => {
    const onMarkRead = vi.fn();
    render(<NotificationDetailPanel notification={notification} isOpen onClose={vi.fn()} onMarkRead={onMarkRead} />);
    fireEvent.click(screen.getByText('Mark as Read'));
    expect(onMarkRead).toHaveBeenCalledWith('1');
  });
});
