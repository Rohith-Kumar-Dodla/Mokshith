import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '../../../../modules/notification/components/NotificationItem.jsx';

const notification = {
  _id: '1',
  title: 'Test Notification',
  message: 'Test message body',
  type: 'ORDER',
  isRead: false,
  createdAt: new Date().toISOString(),
};

describe('NotificationItem', () => {
  it('renders notification title and message', () => {
    render(<NotificationItem notification={notification} onRead={vi.fn()} />);
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Test message body')).toBeInTheDocument();
  });

  it('calls onRead and onSelect when clicked', () => {
    const onRead = vi.fn();
    const onSelect = vi.fn();
    render(<NotificationItem notification={notification} onRead={onRead} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Test Notification'));
    expect(onRead).toHaveBeenCalledWith('1');
    expect(onSelect).toHaveBeenCalledWith(notification);
  });
});
