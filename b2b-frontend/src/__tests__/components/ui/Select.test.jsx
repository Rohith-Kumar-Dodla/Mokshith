import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../../../components/ui/Select.jsx';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  describe('rendering', () => {
    it('should render select element', () => {
      render(<Select options={mockOptions} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select label="Select Option" options={mockOptions} />);
      expect(screen.getByText('Select Option')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Select options={mockOptions} />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<Select options={mockOptions} />);
      mockOptions.forEach((option) => {
        expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
      });
    });

    it('should display error message', () => {
      render(<Select options={mockOptions} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(<Select options={mockOptions} helperText="Choose an option" />);
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('should not display helper text when error exists', () => {
      render(
        <Select
          options={mockOptions}
          error="Error message"
          helperText="Helper text"
        />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('should render with empty options array', () => {
      render(<Select options={[]} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onChange when option is selected', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} onChange={handleChange} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update selected value', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(select).toHaveValue('option2');
    });

    it('should allow keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.click(select);
      await user.keyboard('{ArrowDown}');
      expect(select).toHaveFocus();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Select options={mockOptions} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should not allow selection when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} disabled onChange={handleChange} />);
      const select = screen.getByRole('combobox');

      await user.selectOptions(select, 'option2');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should apply disabled styling', () => {
      render(<Select options={mockOptions} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('opacity-50');
      expect(select).toHaveClass('cursor-not-allowed');
    });
  });

  describe('styling', () => {
    it('should apply error styling when error exists', () => {
      render(<Select options={mockOptions} error="Error" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-100');
      expect(select).toHaveClass('bg-red-50/30');
    });

    it('should apply default styling when no error', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-gray-100');
      expect(select).toHaveClass('bg-gray-50/50');
    });

    it('should apply full width by default', () => {
      const { container } = render(<Select options={mockOptions} />);
      const selectContainer = container.querySelector('.select-container');
      expect(selectContainer).toHaveStyle({ width: '100%' });
    });

    it('should apply auto width when fullWidth is false', () => {
      const { container } = render(<Select options={mockOptions} fullWidth={false} />);
      const selectContainer = container.querySelector('.select-container');
      expect(selectContainer).toHaveStyle({ width: 'auto' });
    });

    it('should apply custom className', () => {
      const { container } = render(<Select options={mockOptions} className="custom-class" />);
      const selectContainer = container.querySelector('.select-container');
      expect(selectContainer).toHaveClass('custom-class');
    });
  });

  describe('controlled component', () => {
    it('should display selected value', () => {
      render(<Select options={mockOptions} value="option2" onChange={() => {}} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('option2');
    });

    it('should update when value prop changes', () => {
      const { rerender } = render(
        <Select options={mockOptions} value="option1" onChange={() => {}} />
      );
      let select = screen.getByRole('combobox');
      expect(select).toHaveValue('option1');

      rerender(<Select options={mockOptions} value="option3" onChange={() => {}} />);
      select = screen.getByRole('combobox');
      expect(select).toHaveValue('option3');
    });
  });

  describe('edge cases', () => {
    it('should handle options with same labels', () => {
      const duplicateOptions = [
        { value: 'val1', label: 'Same Label' },
        { value: 'val2', label: 'Same Label' },
      ];
      render(<Select options={duplicateOptions} />);
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    it('should handle special characters in option labels', () => {
      const specialOptions = [
        { value: '1', label: 'Option & Special' },
        { value: '2', label: 'Option < > "' },
      ];
      render(<Select options={specialOptions} />);
      expect(screen.getByRole('option', { name: 'Option & Special' })).toBeInTheDocument();
    });

    it('should handle long option labels', () => {
      const longOptions = [
        { value: '1', label: 'This is a very long option label that might wrap or truncate' },
      ];
      render(<Select options={longOptions} />);
      expect(screen.getByRole('option', { name: /This is a very long/ })).toBeInTheDocument();
    });

    it('should handle numeric option values', () => {
      const numericOptions = [
        { value: 1, label: 'One' },
        { value: 2, label: 'Two' },
      ];
      render(<Select options={numericOptions} />);
      expect(screen.getByRole('option', { name: 'One' })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should associate label with select', () => {
      render(<Select label="Test Label" options={mockOptions} />);
      const label = screen.getByText('Test Label');
      expect(label.tagName).toBe('LABEL');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');

      await user.tab();
      expect(select).toHaveFocus();
    });
  });

  describe('icon', () => {
    it('should render chevron down icon', () => {
      const { container } = render(<Select options={mockOptions} />);
      const icon = container.querySelector('.pointer-events-none');
      expect(icon).toBeInTheDocument();
    });
  });
});
