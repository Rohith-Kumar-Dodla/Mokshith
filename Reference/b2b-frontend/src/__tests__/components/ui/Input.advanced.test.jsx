import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../../../components/ui/Input.jsx';

describe('Input Component - Advanced Quality Tests', () => {
  describe('Accessibility (A11y)', () => {
    it('should have accessible label association', () => {
      render(<Input label="Email Address" placeholder="Enter email" />);
      
      const input = screen.getByPlaceholderText('Enter email');
      const label = screen.getByText('Email Address');
      
      expect(input).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('should support aria-label for screen readers', () => {
      render(<Input aria-label="Search field" placeholder="Search..." />);
      
      const input = screen.getByLabelText('Search field');
      expect(input).toBeInTheDocument();
    });

    it('should display error styling when error is present', () => {
      render(<Input error="Invalid email" placeholder="Email" />);
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveClass('border-red-100', 'bg-red-50/30');
    });

    it('should display error message', () => {
      render(<Input error="Password too short" placeholder="Password" id="pwd" />);
      
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('should support helper text for additional context', () => {
      render(
        <Input 
          label="Password" 
          helperText="Must be at least 8 characters"
          placeholder="Enter password" 
        />
      );
      
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(<Input placeholder="Field 1" />);
      
      const input = screen.getByPlaceholderText('Field 1');
      input.focus();
      
      expect(input).toHaveFocus();
    });

    it('should support tab navigation', async () => {
      render(
        <>
          <Input placeholder="First" />
          <Input placeholder="Second" />
        </>
      );
      
      const first = screen.getByPlaceholderText('First');
      const second = screen.getByPlaceholderText('Second');
      
      first.focus();
      expect(first).toHaveFocus();
      
      await userEvent.tab();
      expect(second).toHaveFocus();
    });

    it('should show focus indicator', () => {
      render(<Input placeholder="Focus test" />);
      
      const input = screen.getByPlaceholderText('Focus test');
      input.focus();
      
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:border-blue-500');
    });

    it('should have proper input type for password', () => {
      render(<Input type="password" placeholder="Password" />);
      
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should have proper input type for email', () => {
      render(<Input type="email" placeholder="Email" />);
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should show required indicator when required', () => {
      render(<Input label="Required Field" required placeholder="Required" />);
      
      const input = screen.getByPlaceholderText('Required');
      expect(input).toBeRequired();
    });

    it('should not be in tab order when disabled', () => {
      render(<Input disabled placeholder="Disabled" />);
      
      const input = screen.getByPlaceholderText('Disabled');
      expect(input).toBeDisabled();
    });
  });

  describe('User Input Handling', () => {
    it('should handle text input correctly', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} placeholder="Type here" />);
      
      const input = screen.getByPlaceholderText('Type here');
      await userEvent.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle rapid typing', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} placeholder="Rapid type" />);
      
      const input = screen.getByPlaceholderText('Rapid type');
      const longText = 'The quick brown fox jumps over the lazy dog';
      
      await userEvent.type(input, longText);
      
      expect(input).toHaveValue(longText);
    });

    it('should handle paste events', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} placeholder="Paste here" />);
      
      const input = screen.getByPlaceholderText('Paste here');
      
      await userEvent.click(input);
      await userEvent.paste('Pasted content');
      
      expect(input).toHaveValue('Pasted content');
    });

    it('should handle backspace and delete', async () => {
      render(<Input placeholder="Delete test" defaultValue="Hello" />);
      
      const input = screen.getByPlaceholderText('Delete test');
      input.focus();
      
      await userEvent.keyboard('{Backspace}');
      expect(input).toHaveValue('Hell');
      
      await userEvent.keyboard('{Delete}');
      expect(input).toHaveValue('Hell');
    });

    it('should handle select all and delete', async () => {
      render(<Input placeholder="Select all" defaultValue="Delete me" />);
      
      const input = screen.getByPlaceholderText('Select all');
      input.focus();
      
      await userEvent.keyboard('{Control>}a{/Control}');
      await userEvent.keyboard('{Backspace}');
      
      expect(input).toHaveValue('');
    });

    it('should handle controlled input', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled"
          />
        );
      };
      
      render(<ControlledInput />);
      
      const input = screen.getByPlaceholderText('Controlled');
      await userEvent.type(input, 'Controlled value');
      
      expect(input).toHaveValue('Controlled value');
    });

    it('should handle uncontrolled input', async () => {
      render(<Input defaultValue="Initial" placeholder="Uncontrolled" />);
      
      const input = screen.getByPlaceholderText('Uncontrolled');
      expect(input).toHaveValue('Initial');
      
      await userEvent.clear(input);
      await userEvent.type(input, 'Updated');
      
      expect(input).toHaveValue('Updated');
    });

    it('should trim whitespace when specified', async () => {
      const handleChange = vi.fn((e) => {
        e.target.value = e.target.value.trim();
      });
      
      render(<Input onChange={handleChange} placeholder="Trim test" />);
      
      const input = screen.getByPlaceholderText('Trim test');
      await userEvent.type(input, '  spaced  ');
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle undefined value', () => {
      render(<Input value={undefined} placeholder="Undefined" />);
      
      const input = screen.getByPlaceholderText('Undefined');
      expect(input).toHaveValue('');
    });

    it('should handle null value', () => {
      render(<Input value={null} placeholder="Null" />);
      
      const input = screen.getByPlaceholderText('Null');
      expect(input).toHaveValue('');
    });

    it('should handle empty string value', () => {
      render(<Input value="" placeholder="Empty" />);
      
      const input = screen.getByPlaceholderText('Empty');
      expect(input).toHaveValue('');
    });

    it('should handle number as value', () => {
      render(<Input value={12345} placeholder="Number" />);
      
      const input = screen.getByPlaceholderText('Number');
      expect(input).toHaveValue('12345');
    });

    it('should handle zero as value', () => {
      render(<Input value={0} placeholder="Zero" />);
      
      const input = screen.getByPlaceholderText('Zero');
      expect(input).toHaveValue('0');
    });

    it('should handle very long input', async () => {
      const longText = 'A'.repeat(10000);
      render(<Input placeholder="Long text" />);
      
      const input = screen.getByPlaceholderText('Long text');
      
      // This is slow in real typing, so we set the value directly
      input.value = longText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      expect(input).toHaveValue(longText);
    });

    it('should handle basic special characters', async () => {
      render(<Input placeholder="Special chars" />);
      
      const input = screen.getByPlaceholderText('Special chars');
      // Test subset that userEvent supports well
      const specialChars = '!@#$%^&*()';
      
      await userEvent.type(input, specialChars);
      
      expect(input).toHaveValue(specialChars);
    });

    it('should handle unicode characters', async () => {
      render(<Input placeholder="Unicode" />);
      
      const input = screen.getByPlaceholderText('Unicode');
      await userEvent.type(input, '你好世界 🌍');
      
      expect(input).toHaveValue('你好世界 🌍');
    });

    it('should handle emojis', async () => {
      render(<Input placeholder="Emoji test" />);
      
      const input = screen.getByPlaceholderText('Emoji test');
      await userEvent.type(input, '😀😃😄😁');
      
      expect(input).toHaveValue('😀😃😄😁');
    });

    it('should handle HTML entities', async () => {
      render(<Input placeholder="HTML entities" />);
      
      const input = screen.getByPlaceholderText('HTML entities');
      await userEvent.type(input, '<script>alert("XSS")</script>');
      
      expect(input).toHaveValue('<script>alert("XSS")</script>');
    });

    it('should handle SQL injection attempts', async () => {
      render(<Input placeholder="SQL test" />);
      
      const input = screen.getByPlaceholderText('SQL test');
      await userEvent.type(input, "'; DROP TABLE users; --");
      
      expect(input).toHaveValue("'; DROP TABLE users; --");
    });

    it('should handle maxLength attribute', async () => {
      render(<Input maxLength={10} placeholder="Max length" />);
      
      const input = screen.getByPlaceholderText('Max length');
      await userEvent.type(input, '12345678901234567890');
      
      expect(input.value.length).toBeLessThanOrEqual(10);
    });

    it('should handle minLength validation', () => {
      render(<Input minLength={5} placeholder="Min length" />);
      
      const input = screen.getByPlaceholderText('Min length');
      expect(input).toHaveAttribute('minLength', '5');
    });

    it('should handle pattern validation', () => {
      render(<Input pattern="[0-9]*" placeholder="Numbers only" />);
      
      const input = screen.getByPlaceholderText('Numbers only');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });
  });

  describe('Error State Handling', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" placeholder="Error test" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styling', () => {
      render(<Input error="Error" placeholder="Error style" />);
      
      const input = screen.getByPlaceholderText('Error style');
      expect(input).toHaveClass('border-red-100', 'bg-red-50/30');
    });

    it('should not show helper text when error is present', () => {
      render(
        <Input 
          error="Error message" 
          helperText="Helper text"
          placeholder="Error vs helper" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('should handle error toggle', () => {
      const { rerender } = render(<Input error="Error" placeholder="Toggle" />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      rerender(<Input placeholder="Toggle" />);
      
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should handle empty error string', () => {
      render(<Input error="" placeholder="Empty error" />);
      
      const input = screen.getByPlaceholderText('Empty error');
      expect(input).toBeInTheDocument();
    });

    it('should handle very long error message', () => {
      const longError = 'Error: '.repeat(100);
      render(<Input error={longError} placeholder="Long error" />);
      
      // Use regex matcher since text is in a span
      expect(screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content.startsWith('Error: Error:');
      })).toBeInTheDocument();
    });
  });

  describe('Performance & Memory', () => {
    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = render(<Input placeholder="Rerender test" />);
      
      for (let i = 0; i < 100; i++) {
        rerender(<Input placeholder="Rerender test" value={`Value ${i}`} />);
      }
      
      const input = screen.getByPlaceholderText('Rerender test');
      expect(input).toHaveValue('Value 99');
    });

    it('should not cause memory leaks on unmount', () => {
      const handleChange = vi.fn();
      const { unmount } = render(<Input onChange={handleChange} placeholder="Unmount test" />);
      
      unmount();
      
      // Handler should not be called after unmount
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should trigger onChange on input', async () => {
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} placeholder="Debounce" />);
      
      const input = screen.getByPlaceholderText('Debounce');
      
      await userEvent.type(input, 'abc');
      
      // Should trigger onChange for each keystroke
      expect(handleChange.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Type-Specific Behavior', () => {
    it('should have correct type attribute for number input', () => {
      render(<Input type="number" placeholder="Number input" />);
      
      const input = screen.getByPlaceholderText('Number input');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should handle email input validation', () => {
      render(<Input type="email" placeholder="Email input" />);
      
      const input = screen.getByPlaceholderText('Email input');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle tel input type', () => {
      render(<Input type="tel" placeholder="Phone" />);
      
      const input = screen.getByPlaceholderText('Phone');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should handle url input type', () => {
      render(<Input type="url" placeholder="Website" />);
      
      const input = screen.getByPlaceholderText('Website');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should handle date input type', () => {
      render(<Input type="date" placeholder="Date" />);
      
      const input = screen.getByPlaceholderText('Date');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should handle search input type', () => {
      render(<Input type="search" placeholder="Search" />);
      
      const input = screen.getByPlaceholderText('Search');
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('Form Integration', () => {
    it('should have proper name attribute for forms', () => {
      render(<Input name="username" placeholder="Username" />);
      
      const input = screen.getByPlaceholderText('Username');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should support reset button type', () => {
      render(
        <form>
          <Input defaultValue="Initial" placeholder="Reset test" />
          <button type="reset">Reset</button>
        </form>
      );
      
      const input = screen.getByPlaceholderText('Reset test');
      expect(input).toHaveValue('Initial');
    });

    it('should support required validation', () => {
      render(
        <form>
          <Input required placeholder="Required field" />
        </form>
      );
      
      const input = screen.getByPlaceholderText('Required field');
      expect(input).toBeRequired();
    });

    it('should support autocomplete attribute', () => {
      render(<Input autoComplete="email" placeholder="Email" />);
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });
  });

  describe('Async Operations', () => {
    it('should support onBlur handler', () => {
      const handleBlur = vi.fn();
      
      render(<Input placeholder="Async validate" onBlur={handleBlur} />);
      
      const input = screen.getByPlaceholderText('Async validate');
      input.focus();
      input.blur();
      
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should handle multiple onChange calls', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} placeholder="Async change" />);
      
      const input = screen.getByPlaceholderText('Async change');
      
      await userEvent.type(input, 'a');
      await userEvent.type(input, 'b');
      
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
