import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import NotificationDrawer from './NotificationDrawer';

function Location(){const location=useLocation();return <span data-testid="location">{location.pathname}</span>}

describe('Super Admin NotificationDrawer',()=>{
  it('shows unread notifications, marks them read and follows trusted deep links',async()=>{const markRead=vi.fn().mockResolvedValue();render(<MemoryRouter initialEntries={['/super-admin/dashboard']}><NotificationDrawer isOpen onClose={vi.fn()} notifications={[{id:'n1',title:'New Order Created',message:'Order created',time:'Now',read:false,category:'ORDER',actionUrl:'/super-admin/orders'}]} onMarkRead={markRead}/><Location/></MemoryRouter>);expect(screen.getByText('New Order Created')).toBeInTheDocument();fireEvent.click(screen.getByText('New Order Created'));expect(markRead).toHaveBeenCalledWith('n1');expect(await screen.findByTestId('location')).toHaveTextContent('/super-admin/orders');});
  it('renders loading, empty and retryable error states',()=>{const retry=vi.fn();const{rerender}=render(<MemoryRouter><NotificationDrawer isOpen onClose={vi.fn()} notifications={[]} loading/></MemoryRouter>);expect(screen.getByText(/Loading notifications/)).toBeInTheDocument();rerender(<MemoryRouter><NotificationDrawer isOpen onClose={vi.fn()} notifications={[]} error="Network failed" onRetry={retry}/></MemoryRouter>);fireEvent.click(screen.getByText('Retry'));expect(retry).toHaveBeenCalled();});
});
