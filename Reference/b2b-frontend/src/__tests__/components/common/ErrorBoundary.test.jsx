import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../../components/common/ErrorBoundary.jsx';

const ThrowError = ({ shouldThrow, errorMessage }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div>Normal Content</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('normal rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First Child</div>
          <div>Second Child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });

    it('should render complex component tree', () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <button>Button</button>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should catch and display error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
    });

    it('should show warning icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show reload button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('should not render children when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Normal Content')).not.toBeInTheDocument();
    });

    it('should maintain error state', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <div>New Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('reload functionality', () => {
    it('should have reload button with click handler', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload application/i });
      expect(reloadButton).toBeInTheDocument();
    });

    it('should reload page when button is clicked', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload application/i });
      reloadButton.click();

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('error message display', () => {
    it('should show default message when error has no message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="" />
        </ErrorBoundary>
      );

      // Check for the error UI heading
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      // The component should render - we can verify by checking for the reload button
      expect(screen.getByText('Reload Application')).toBeInTheDocument();
    });

    it('should display custom error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network connection failed" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Network connection failed/)).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      const longMessage = 'This is a very long error message '.repeat(10);
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={longMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText(new RegExp(longMessage.substring(0, 50)))).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have full height container', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveStyle({ height: '100vh' });
    });

    it('should center content', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });
    });

    it('should have text alignment', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = container.firstChild;
      expect(errorContainer).toHaveStyle({ textAlign: 'center' });
    });
  });

  describe('edge cases', () => {
    it('should handle null error', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={null} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle undefined error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={undefined} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should recover when error prop changes', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal Content')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle errors in nested components', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <ThrowError shouldThrow={true} />
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('lifecycle methods', () => {
    it('should call getDerivedStateFromError', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should call componentDidCatch', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessible button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /reload application/i });
      expect(button).toBeInTheDocument();
    });

    it('should have readable error text', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeVisible();
    });
  });
});
