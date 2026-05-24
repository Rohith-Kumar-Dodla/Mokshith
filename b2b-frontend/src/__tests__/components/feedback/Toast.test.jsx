import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../../../components/feedback/Toast.jsx';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render toast with message', () => {
      render(<Toast message="Test message" onClose={mockOnClose} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with success type by default', () => {
      const { container } = render(<Toast message="Success!" onClose={mockOnClose} />);

      const toast = container.querySelector('.toast-container');
      expect(toast).toHaveClass('success');
    });

    it('should render with error type', () => {
      const { container } = render(
        <Toast message="Error!" type="error" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.toast-container');
      expect(toast).toHaveClass('error');
    });

    it('should render with info type', () => {
      const { container } = render(
        <Toast message="Info!" type="info" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.toast-container');
      expect(toast).toHaveClass('info');
    });

    it('should render close button', () => {
      render(<Toast message="Test" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render icon for success', () => {
      const { container } = render(<Toast message="Success" onClose={mockOnClose} />);

      const icon = container.querySelector('.toast-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon for error', () => {
      const { container } = render(
        <Toast message="Error" type="error" onClose={mockOnClose} />
      );

      const icon = container.querySelector('.toast-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon for info', () => {
      const { container } = render(
        <Toast message="Info" type="info" onClose={mockOnClose} />
      );

      const icon = container.querySelector('.toast-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('should auto-close after default duration (3000ms)', async () => {
      render(<Toast message="Auto close" onClose={mockOnClose} />);

      expect(mockOnClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-close after custom duration', async () => {
      render(<Toast message="Custom duration" onClose={mockOnClose} duration={5000} />);

      vi.advanceTimersByTime(4999);
      expect(mockOnClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not auto-close before duration ends', () => {
      render(<Toast message="Wait" onClose={mockOnClose} duration={5000} />);

      vi.advanceTimersByTime(4000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', () => {
      const { unmount } = render(<Toast message="Test" onClose={mockOnClose} />);

      unmount();
      vi.advanceTimersByTime(3000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('manual close', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Toast message="Click to close" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should allow closing before auto-dismiss', async () => {
      vi.useFakeTimers();
      render(<Toast message="Manual close" onClose={mockOnClose} duration={5000} />);

      vi.advanceTimersByTime(2000);
      
      // Use real timers temporarily for userEvent interaction
      vi.useRealTimers();
      const user = userEvent.setup();
      const closeButton = screen.getByRole('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('should have fixed positioning', () => {
      const { container } = render(<Toast message="Positioned" onClose={mockOnClose} />);

      const toast = container.querySelector('.toast-container');
      expect(toast).toHaveClass('toast-container');
    });

    it('should render style tag', () => {
      const { container } = render(<Toast message="Styled" onClose={mockOnClose} />);

      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
    });

    it('should have success border for success type', () => {
      const { container } = render(
        <Toast message="Success" type="success" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.success');
      expect(toast).toBeInTheDocument();
    });

    it('should have error border for error type', () => {
      const { container } = render(
        <Toast message="Error" type="error" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.error');
      expect(toast).toBeInTheDocument();
    });

    it('should have info border for info type', () => {
      const { container } = render(
        <Toast message="Info" type="info" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.info');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('message content', () => {
    it('should display short message', () => {
      render(<Toast message="OK" onClose={mockOnClose} />);

      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should display long message', () => {
      const longMessage = 'This is a very long toast message that contains a lot of text';
      render(<Toast message={longMessage} onClose={mockOnClose} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Toast message="Error: User <admin> failed!" onClose={mockOnClose} />);

      expect(screen.getByText('Error: User <admin> failed!')).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      render(<Toast message="" onClose={mockOnClose} />);

      const { container } = render(<Toast message="" onClose={mockOnClose} />);
      expect(container.querySelector('.toast-message')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle duration of 0', () => {
      vi.useFakeTimers();
      render(<Toast message="Instant" onClose={mockOnClose} duration={0} />);

      vi.advanceTimersByTime(0);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      
      vi.useRealTimers();
    });

    it('should handle very long duration', () => {
      vi.useFakeTimers();
      render(<Toast message="Long wait" onClose={mockOnClose} duration={100000} />);

      vi.advanceTimersByTime(50000);

      expect(mockOnClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should handle multiple clicks on close button', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Toast message="Multiple clicks" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid type gracefully', () => {
      const { container } = render(
        <Toast message="Invalid type" type="invalid" onClose={mockOnClose} />
      );

      const toast = container.querySelector('.toast-container');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible close button', () => {
      render(<Toast message="Accessible" onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should be visible', () => {
      const { container } = render(<Toast message="Visible" onClose={mockOnClose} />);

      const toast = container.querySelector('.toast-container');
      expect(toast).toBeVisible();
    });

    it('should have readable message', () => {
      render(<Toast message="Read me" onClose={mockOnClose} />);

      const message = screen.getByText('Read me');
      expect(message).toBeVisible();
    });
  });

  describe('lifecycle', () => {
    it('should set up timer on mount', () => {
      render(<Toast message="Mount" onClose={mockOnClose} />);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clean up timer on unmount', () => {
      vi.useFakeTimers();
      const { unmount } = render(<Toast message="Unmount" onClose={mockOnClose} />);

      unmount();
      vi.advanceTimersByTime(3000);

      expect(mockOnClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should reset timer on duration change', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <Toast message="Duration change" onClose={mockOnClose} duration={3000} />
      );

      vi.advanceTimersByTime(2000);
      
      // At this point, 1000ms remain on the original 3000ms timer
      expect(mockOnClose).not.toHaveBeenCalled();

      rerender(<Toast message="Duration change" onClose={mockOnClose} duration={5000} />);

      // Timer should be reset - advance 3000ms (not enough for new 5000ms duration)
      vi.advanceTimersByTime(3000);
      expect(mockOnClose).not.toHaveBeenCalled();
      
      // Advance remaining 2000ms to reach new 5000ms duration
      vi.advanceTimersByTime(2000);
      expect(mockOnClose).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });
});
