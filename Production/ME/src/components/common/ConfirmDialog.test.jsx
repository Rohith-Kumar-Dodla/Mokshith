import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Logout"
        message="Are you sure you want to logout from your account?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to logout from your account?')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Confirm Logout"
        message="Are you sure?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Logout is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="Confirm Logout"
        message="Are you sure?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={vi.fn()}
        title="Confirm Logout"
        message="Are you sure?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Logout"
        message="Are you sure?"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
