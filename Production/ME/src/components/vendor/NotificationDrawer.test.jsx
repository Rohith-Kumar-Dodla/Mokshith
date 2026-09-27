import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationDrawer from './NotificationDrawer';

describe('Vendor NotificationDrawer', () => {
  it('contains scrolling within the notification list', () => {
    render(<NotificationDrawer isOpen onClose={vi.fn()} notifications={[{ id: '1', title: 'Order', message: 'Updated', time: 'Now', read: false }]} />);
    const list = screen.getByText('Updated').closest('.overflow-y-auto');
    expect(list).toHaveClass('overscroll-contain', 'touch-pan-y', 'min-h-0');
    expect(list.parentElement).toHaveClass('overflow-hidden');
  });
});
