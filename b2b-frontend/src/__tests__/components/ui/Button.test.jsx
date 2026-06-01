import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../../components/ui/Button.jsx';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByText('Primary');
      expect(button).toHaveClass('premium-button-primary');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText('Secondary');
      expect(button).toHaveClass('premium-button-secondary');
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByText('Button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render full width button', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByText('Full Width');
      expect(button).toHaveClass('w-full');
    });

    it('should render as submit type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByText('Submit');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render as button type by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByText('Button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply opacity class when loading', () => {
      render(<Button loading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-70');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('should not trigger onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button loading onClick={handleClick}>Submit</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      expect(button).toBeDisabled();
    });

    it('should not trigger onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByText('Click');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should receive event object in onClick', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByText('Click');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByText('Click');
      
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support space key activation', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByText('Click');
      
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML attributes', () => {
    it('should pass through valid HTML attributes', () => {
      render(
        <Button id="test-btn" data-testid="custom-button" aria-label="Test Button">
          Button
        </Button>
      );
      
      const button = screen.getByText('Button');
      expect(button).toHaveAttribute('id', 'test-btn');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Test Button');
    });

    it('should not pass invalid props to DOM', () => {
      render(
        <Button active={true} icon="test" helperText="help">
          Button
        </Button>
      );
      
      const button = screen.getByText('Button');
      expect(button).not.toHaveAttribute('active');
      expect(button).not.toHaveAttribute('icon');
      expect(button).not.toHaveAttribute('helperText');
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      const button = screen.getByText('Rapid Click');
      
      await user.tripleClick(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should work with both loading and disabled', () => {
      render(<Button loading disabled>Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      const button = screen.getByLabelText('Submit form');
      expect(button).toBeInTheDocument();
    });

    it('should indicate disabled state to screen readers', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should be focusable when not disabled', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByText('Focus me');
      
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText('Disabled');
      
      button.focus();
      expect(button).not.toHaveFocus();
    });
  });
});
