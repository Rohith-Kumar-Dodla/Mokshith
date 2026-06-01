import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../../../components/feedback/ConfirmDialog.jsx';

vi.mock('../../../components/ui/Modal.jsx', () => ({
  default: ({ children, isOpen, onClose, size }) => 
    isOpen ? <div data-testid="mock-modal" data-size={size}>{children}</div> : null
}));

vi.mock('../../../components/ui/Button.jsx', () => ({
  default: ({ children, onClick, disabled, loading, variant, className, ...props }) => (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      className={className}
      data-loading={loading}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('ConfirmDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('should display message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should render confirm button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should render cancel button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should render with custom confirm text', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="Yes, Delete" />);

      expect(screen.getByRole('button', { name: 'Yes, Delete' })).toBeInTheDocument();
    });

    it('should render with custom cancel text', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="No, Keep" />);

      expect(screen.getByRole('button', { name: 'No, Keep' })).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(
        <ConfirmDialog {...defaultProps} message="Delete this item permanently?" />
      );

      expect(screen.getByText('Delete this item permanently?')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm multiple times on rapid clicks', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(3);
    });
  });

  describe('variants', () => {
    it('should render with primary variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveAttribute('data-variant', 'primary');
    });

    it('should render with danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveAttribute('data-variant', 'danger');
    });

    it('should apply correct className for primary variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="primary" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('confirm-btn-primary');
    });

    it('should apply correct className for danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('confirm-btn-danger');
    });
  });

  describe('loading state', () => {
    it('should disable confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();
    });

    it('should disable cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading state on confirm button', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveAttribute('data-loading', 'true');
    });

    it('should not call onConfirm when loading', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      await user.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should not call onClose when loading', async () => {
      const user = userEvent.setup();
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('modal properties', () => {
    it('should pass isOpen prop to Modal', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();

      rerender(<ConfirmDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('should pass onClose prop to Modal', () => {
      render(<ConfirmDialog {...defaultProps} />);
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should set modal size to sm', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const modal = screen.getByTestId('mock-modal');
      expect(modal).toHaveAttribute('data-size', 'sm');
    });
  });

  describe('styling', () => {
    it('should have centered text container', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should render message in styled container', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const messageContainer = container.querySelector('.bg-gray-50.rounded-xl');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should have custom styles injected', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag.innerHTML).toContain('confirm-btn-danger');
      expect(styleTag.innerHTML).toContain('confirm-btn-primary');
    });
  });

  describe('button layout', () => {
    it('should render buttons in column layout', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const buttonContainer = container.querySelector('.flex.flex-col');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should have gap between buttons', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const buttonContainer = container.querySelector('.flex.flex-col');
      expect(buttonContainer).toHaveClass('gap-3');
    });

    it('should render confirm button before cancel button', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('Confirm');
      expect(buttons[1]).toHaveTextContent('Cancel');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      render(<ConfirmDialog {...defaultProps} message="" />);

      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage = 'This is a very long message '.repeat(20);
      render(<ConfirmDialog {...defaultProps} message={longMessage} />);

      expect(screen.getByText(/This is a very long message/, { exact: false })).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      render(<ConfirmDialog {...defaultProps} message="Delete 'item' & confirm?" />);

      expect(screen.getByText("Delete 'item' & confirm?")).toBeInTheDocument();
    });

    it('should handle undefined confirmText', () => {
      render(<ConfirmDialog {...defaultProps} confirmText={undefined} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should handle undefined cancelText', () => {
      render(<ConfirmDialog {...defaultProps} cancelText={undefined} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible buttons', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should show disabled state visually', () => {
      render(<ConfirmDialog {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();
    });

    it('should have readable message text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const message = screen.getByText('Are you sure you want to proceed?');
      expect(message).toBeVisible();
    });
  });
});
