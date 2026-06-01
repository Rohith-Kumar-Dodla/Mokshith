import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../../components/ui/Modal.jsx';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} title="Test Modal" onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} title="Test Modal" onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('should render with default isOpen=true', () => {
      render(
        <Modal title="Default Open">Content</Modal>
      );

      expect(screen.getByText('Default Open')).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose}>
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose}>
          Content
        </Modal>
      );

      const backdrop = document.body.querySelector('.bg-black\\/60');
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close when overlay clicked if closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Modal
          isOpen={true}
          title="Test"
          onClose={mockOnClose}
          closeOnOverlayClick={false}
        >
          Content
        </Modal>
      );

      const backdrop = container.querySelector('.bg-black\\/60');
      await user.click(backdrop);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not close when preventClose is true', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose} preventClose>
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not close on Escape when preventClose is true', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose} preventClose>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should hide close button when showCloseIcon is false', () => {
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose} showCloseIcon={false}>
          Content
        </Modal>
      );

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should apply sm size class', () => {
      render(
        <Modal isOpen={true} title="Test" size="sm">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-sm');
      expect(modal).toBeInTheDocument();
    });

    it('should apply md size class by default', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-md');
      expect(modal).toBeInTheDocument();
    });

    it('should apply lg size class', () => {
      render(
        <Modal isOpen={true} title="Test" size="lg">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });

    it('should apply xl size class', () => {
      render(
        <Modal isOpen={true} title="Test" size="xl">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-xl');
      expect(modal).toBeInTheDocument();
    });

    it('should apply 2xl size class', () => {
      render(
        <Modal isOpen={true} title="Test" size="2xl">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('should apply full size class', () => {
      render(
        <Modal isOpen={true} title="Test" size="full">
          Content
        </Modal>
      );

      const modal = document.body.querySelector('.max-w-\\[95vw\\]');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('body scroll lock', () => {
    it('should lock body scroll when modal is open', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} title="Test">
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should unlock body scroll on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('portal rendering', () => {
    it('should render in portal (outside parent)', () => {
      const { container } = render(
        <div id="parent">
          <Modal isOpen={true} title="Test">
            Content
          </Modal>
        </div>
      );

      const parent = container.querySelector('#parent');
      expect(parent.innerHTML).toBe('');
    });
  });

  describe('children', () => {
    it('should render children content', () => {
      render(
        <Modal isOpen={true} title="Test">
          <div data-testid="child">Child content</div>
        </Modal>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <Modal isOpen={true} title="Test">
          <div>
            <h1>Heading</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </Modal>
      );

      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('should render footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          title="Test"
          footer={<div>Footer content</div>}
        >
          Content
        </Modal>
      );

      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('event propagation', () => {
    it('should stop propagation when clicking modal content', async () => {
      const user = userEvent.setup();
      const onContentClick = vi.fn();
      
      render(
        <Modal isOpen={true} title="Test" onClose={mockOnClose}>
          <div onClick={onContentClick}>Content</div>
        </Modal>
      );

      const content = screen.getByText('Content');
      await user.click(content);

      expect(onContentClick).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper z-index for stacking', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      const modalContainer = document.body.querySelector('.z-\\[20000\\]');
      expect(modalContainer).toBeInTheDocument();
    });

    it('should have backdrop blur effect', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      const backdrop = document.body.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('should disable close button when preventClose is true', () => {
      render(
        <Modal isOpen={true} title="Test" preventClose>
          Content
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing onClose prop', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(
        <Modal isOpen={true} title="">
          Content
        </Modal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <Modal isOpen={true} title="Test">
        </Modal>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('animations and transitions', () => {
    it('should have transition classes', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      const modalWrapper = document.body.querySelector('.transition-all');
      expect(modalWrapper).toBeInTheDocument();
    });

    it('should apply scale animation when open', () => {
      render(
        <Modal isOpen={true} title="Test">
          Content
        </Modal>
      );

      const modalContent = document.body.querySelector('.scale-100');
      expect(modalContent).toBeInTheDocument();
    });
  });
});
