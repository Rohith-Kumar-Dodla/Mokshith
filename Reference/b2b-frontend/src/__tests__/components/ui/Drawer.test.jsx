import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Drawer from '../../../components/ui/Drawer.jsx';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Drawer isOpen={false} onClose={vi.fn()} title="Test">Content</Drawer>);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and children when open', () => {
    render(<Drawer isOpen onClose={vi.fn()} title="Details">Drawer content</Drawer>);
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Drawer isOpen onClose={onClose} title="Test">Content</Drawer>);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
