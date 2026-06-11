import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationBadge from '../../../components/common/NotificationBadge.jsx';

vi.mock('../../../modules/notification/services/notificationService.js', () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([
      { _id: '1', isRead: false },
      { _id: '2', isRead: true },
    ]),
  },
}));

describe('NotificationBadge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders bell link to notifications', async () => {
    render(<MemoryRouter><NotificationBadge /></MemoryRouter>);
    expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
