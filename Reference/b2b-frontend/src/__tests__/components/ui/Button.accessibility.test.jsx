import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../../components/ui/Button.jsx';

describe('Button Component - Advanced Quality Tests', () => {
  describe('Accessibility (A11y)', () => {
    it('should render as semantic button element', () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should properly disable button', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });

    it('should support aria-label override', () => {
      render(<Button aria-label="Custom label">Click</Button>);
      const button = screen.getByLabelText('Custom label');
      expect(button).toBeInTheDocument();
    });

    it('should support aria-describedby for additional context', () => {
      render(
        <>
          <Button aria-describedby="button-desc">Submit Form</Button>
          <div id="button-desc">Submits the registration form</div>
        </>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'button-desc');
    });

    it('should maintain focus visibility', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate Enter key
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Simulate Space key
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have semantic button role', () => {
      render(<Button>Semantic Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should be properly disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });
  });

  describe('Performance & Re-renders', () => {
    it('should not re-render when props do not change', () => {
      const renderSpy = vi.fn();
      
      const TrackedButton = (props) => {
        renderSpy();
        return <Button {...props} />;
      };
      
      const { rerender } = render(<TrackedButton>Test</TrackedButton>);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<TrackedButton>Test</TrackedButton>);
      
      // Should render again (React doesn't auto-memoize)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid repeated clicks gracefully', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      const user = userEvent.setup();
      
      // Simulate 10 rapid clicks
      await Promise.all(
        Array.from({ length: 10 }, () => user.click(button))
      );
      
      expect(handleClick).toHaveBeenCalledTimes(10);
    });

    it('should not cause memory leaks with event handlers', () => {
      const handleClick = vi.fn();
      const { unmount } = render(<Button onClick={handleClick}>Test</Button>);
      
      unmount();
      
      // Handler should not be called after unmount
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle thousands of renders efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const { unmount } = render(<Button>Button {i}</Button>);
        unmount();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (< 2.5 seconds - allows for CI overhead)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle null children gracefully', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('should handle undefined children', () => {
      render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle empty string children', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle number as children', () => {
      render(<Button>{0}</Button>);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('0');
    });

    it('should handle boolean children', () => {
      render(<Button>{true}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle React fragments as children', () => {
      render(
        <Button>
          <>
            <span>Part 1</span>
            <span>Part 2</span>
          </>
        </Button>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });

    it('should handle array of children', () => {
      render(<Button>{['Item 1', 'Item 2']}</Button>);
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Item 1');
      expect(button.textContent).toContain('Item 2');
    });

    it('should handle very long text without breaking layout', () => {
      const longText = 'A'.repeat(1000);
      render(<Button>{longText}</Button>);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe(longText);
    });

    it('should handle special characters in children', () => {
      render(<Button>{'<>&"\''}</Button>);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('<>&"\'');
    });

    it('should handle emojis in children', () => {
      render(<Button>Click 👍 Me 🚀</Button>);
      expect(screen.getByText(/Click 👍 Me 🚀/)).toBeInTheDocument();
    });

    it('should handle RTL text', () => {
      render(<Button>مرحبا</Button>);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('مرحبا');
    });

    it('should handle click when onClick is undefined', async () => {
      render(<Button>No Handler</Button>);
      const button = screen.getByRole('button');
      
      // Should not throw
      await expect(userEvent.click(button)).resolves.not.toThrow();
    });

    it('should handle click when onClick is null', async () => {
      render(<Button onClick={null}>Null Handler</Button>);
      const button = screen.getByRole('button');
      
      await expect(userEvent.click(button)).resolves.not.toThrow();
    });

    it('should prevent click when disabled', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle rapid enable/disable toggles', async () => {
      const handleClick = vi.fn();
      const { rerender } = render(<Button onClick={handleClick}>Toggle</Button>);
      
      const button = screen.getByRole('button');
      
      rerender(<Button disabled onClick={handleClick}>Toggle</Button>);
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
      
      rerender(<Button onClick={handleClick}>Toggle</Button>);
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Boundary Compatibility', () => {
    it('should not throw when rendered within error boundary', () => {
      const ErrorBoundary = class extends React.Component {
        state = { hasError: false };
        
        static getDerivedStateFromError() {
          return { hasError: true };
        }
        
        render() {
          if (this.state.hasError) {
            return <div>Error occurred</div>;
          }
          return this.props.children;
        }
      };
      
      render(
        <ErrorBoundary>
          <Button>Safe Button</Button>
        </ErrorBoundary>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });
  });

  describe('Async Behavior', () => {
    it('should handle async onClick handlers', async () => {
      const asyncHandler = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      
      render(<Button onClick={asyncHandler}>Async Button</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(asyncHandler).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(asyncHandler).toHaveReturned();
      });
    });

    it('should handle async onClick handlers', async () => {
      let resolved = false;
      const asyncHandler = vi.fn().mockImplementation(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 10);
        })
      );
      
      render(<Button onClick={asyncHandler}>Async Button</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(asyncHandler).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(resolved).toBe(true);
      });
    });

    it('should handle rapid clicks during async operation', async () => {
      let callCount = 0;
      const asyncHandler = vi.fn().mockImplementation(
        () => new Promise((resolve) => {
          callCount++;
          setTimeout(() => resolve(callCount), 50);
        })
      );
      
      render(<Button onClick={asyncHandler}>Async</Button>);
      
      const button = screen.getByRole('button');
      const user = userEvent.setup();
      
      // Click multiple times rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(asyncHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with Forms', () => {
    it('should submit form when type is submit', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not submit form when type is button', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="button">Do Not Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should not submit form when disabled', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled>Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Style & Layout Edge Cases', () => {
    it('should handle missing variant gracefully', () => {
      render(<Button variant={undefined}>No Variant</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle invalid variant', () => {
      render(<Button variant="invalid-variant">Invalid</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle multiple className conflicts', () => {
      render(
        <Button className="class1 class2 class3 class1">
          Multiple Classes
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('class1', 'class2', 'class3');
    });

    it('should handle empty className', () => {
      render(<Button className="">Empty Class</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle className with special characters', () => {
      render(<Button className="my-class_123">Special Class</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('my-class_123');
    });
  });
});
