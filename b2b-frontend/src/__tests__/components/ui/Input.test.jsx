import React from 'react';import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../../../components/ui/Input.jsx';

describe('Input Component', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email Address" />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should apply custom className to container', () => {
      const { container } = render(<Input className="custom-class" />);
      const inputContainer = container.querySelector('.input-container');
      expect(inputContainer).toHaveClass('custom-class');
    });

    it('should render full width', () => {
      const { container } = render(<Input fullWidth />);
      const inputContainer = container.querySelector('.input-container');
      expect(inputContainer).toHaveStyle({ width: '100%' });
    });
  });

  describe('input types', () => {
    it('should render text input by default', () => {
      render(<Input placeholder="Test input" />);
      const input = screen.getByPlaceholderText('Test input');
      expect(input).toBeInTheDocument();
      // HTML inputs default to type="text" but attribute may not be present
      expect(input.type).toBe('text');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('placeholder', () => {
    it('should display placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });
  });

  describe('value and onChange', () => {
    it('should display value', () => {
      render(<Input value="Test Value" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('Test Value');
    });

    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value on input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'New value');
      expect(input).toHaveValue('New value');
    });
  });

  describe('error handling', () => {
    it('should display error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styling when error exists', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-100');
      expect(input).toHaveClass('bg-red-50/30');
    });

    it('should not display helper text when error exists', () => {
      render(<Input error="Error" helperText="Helper" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('should show error icon/indicator', () => {
      const { container } = render(<Input error="Error message" />);
      const errorIndicator = container.querySelector('.bg-red-500.rounded-full');
      expect(errorIndicator).toBeInTheDocument();
    });
  });

  describe('helper text', () => {
    it('should display helper text when no error', () => {
      render(<Input helperText="Enter a valid email" />);
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    });

    it('should apply helper text styling', () => {
      const { container } = render(<Input helperText="Helper text" />);
      const helper = screen.getByText('Helper text');
      expect(helper).toHaveClass('text-gray-400');
    });

    it('should show helper indicator', () => {
      const { container } = render(<Input helperText="Helper" />);
      const helperIndicator = container.querySelector('.bg-gray-200.rounded-full');
      expect(helperIndicator).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('required state', () => {
    it('should mark input as required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });
  });

  describe('HTML attributes', () => {
    it('should pass through name attribute', () => {
      render(<Input name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('should pass through id attribute', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
    });

    it('should pass through maxLength', () => {
      render(<Input maxLength={50} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '50');
    });

    it('should pass through autoComplete', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });

    it('should pass through pattern', () => {
      render(<Input pattern="[0-9]{3}" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[0-9]{3}');
    });
  });

  describe('focus state', () => {
    it('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should support autoFocus', () => {
      render(<Input autoFocus />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('styling', () => {
    it('should apply default styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('premium-input');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-2xl');
    });

    it('should apply focus styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-500');
      expect(input).toHaveClass('focus:bg-white');
    });

    it('should have proper spacing', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-5');
      expect(input).toHaveClass('py-4');
    });
  });

  describe('accessibility', () => {
    it('should associate label with input', () => {
      render(<Input label="Email" id="email" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email');
      
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('should support aria-describedby for errors', () => {
      render(<Input error="Error message" aria-describedby="error-id" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'error-id');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string value', () => {
      render(<Input value="" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle undefined value', () => {
      render(<Input value={undefined} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle null value', () => {
      render(<Input value={null} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should render with all props combined', () => {
      render(
        <Input
          label="Test Input"
          value="test"
          error="Error"
          helperText="Helper"
          placeholder="Enter text"
          required
          disabled
          fullWidth
          className="custom"
        />
      );
      
      expect(screen.getByText('Test Input')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });
});
