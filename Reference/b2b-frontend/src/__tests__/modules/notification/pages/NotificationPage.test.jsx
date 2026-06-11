import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationPage from '../../../../modules/notification/pages/NotificationPage.jsx';

vi.mock('../../../../modules/notification/hooks/useNotifications.js', () => ({
  useNotifications: () => ({
    notifications: [
      { _id: '1', title: 'Order Shipped', message: 'Your order shipped', type: 'ORDER', isRead: false, createdAt: new Date().toISOString() },
    ],
    loading: false,
    error: null,
    unreadCount: 1,
    selectedNotification: null,
    setSelectedNotification: vi.fn(),
    markAsRead: vi.fn(),
  }),
}));

describe('NotificationPage', () => {
  it('renders notifications heading', () => {
    render(<NotificationPage />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Order Shipped')).toBeInTheDocument();
  });

  it('shows unread count', () => {
    render(<NotificationPage />);
    expect(screen.getByText(/1 unread/)).toBeInTheDocument();
  });
});
