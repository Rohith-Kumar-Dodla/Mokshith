import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OTPInput from '../../../modules/auth/components/OTPInput.jsx';

describe('OTPInput Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render 6 input fields by default', () => {
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('should render custom length of inputs', () => {
      render(<OTPInput length={4} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(4);
    });

    it('should render 8 inputs when length is 8', () => {
      render(<OTPInput length={8} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(8);
    });

    it('should render empty inputs initially', () => {
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('input interactions', () => {
    it('should accept numeric input', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '5');

      expect(inputs[0]).toHaveValue('5');
    });

    it('should call onChange with complete OTP', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0]).toContain('123');
    });

    it('should reject non-numeric input', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'a');

      expect(inputs[0]).toHaveValue('');
    });

    it('should reject special characters', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '@');

      expect(inputs[0]).toHaveValue('');
    });

    it('should accept only single digit', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '99');

      expect(inputs[0]).toHaveValue('9');
    });
  });

  describe('OTP completion', () => {
    it('should call onChange with complete 6-digit OTP', async () => {
      const user = userEvent.setup();
      render(<OTPInput length={6} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');
      await user.type(inputs[3], '4');
      await user.type(inputs[4], '5');
      await user.type(inputs[5], '6');

      const calls = mockOnChange.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('123456');
    });

    it('should call onChange with partial OTP', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should update OTP on each digit entry', async () => {
      const user = userEvent.setup();
      render(<OTPInput length={4} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      expect(mockOnChange).toHaveBeenCalledWith('1');

      await user.clear(inputs[0]);
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      expect(mockOnChange).toHaveBeenCalledWith('12');
    });
  });

  describe('input properties', () => {
    it('should have maxLength of 1 for each input', () => {
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });

    it('should have unique keys for each input', () => {
      const { container } = render(<OTPInput onChange={mockOnChange} length={6} />);

      const inputs = container.querySelectorAll('input');
      // React keys are internal - verify all inputs are rendered correctly
      expect(inputs.length).toBe(6);
      inputs.forEach((input) => {
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle length of 1', () => {
      render(<OTPInput length={1} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(1);
    });

    it('should handle large length', () => {
      render(<OTPInput length={10} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(10);
    });

    it('should handle changing values', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '5');
      expect(inputs[0]).toHaveValue('5');

      await user.clear(inputs[0]);
      await user.type(inputs[0], '9');
      expect(inputs[0]).toHaveValue('9');
    });

    it('should handle rapid input', async () => {
      const user = userEvent.setup();
      render(<OTPInput length={3} onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle empty onChange initially', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);

      expect(inputs[0]).toHaveFocus();
    });

    it('should handle backspace/delete', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '5');
      expect(inputs[0]).toHaveValue('5');

      await user.clear(inputs[0]);
      expect(inputs[0]).toHaveValue('');
    });
  });

  describe('styling', () => {
    it('should have flex container', () => {
      const { container } = render(<OTPInput onChange={mockOnChange} />);

      const wrapper = container.querySelector('div[style*="display"]');
      expect(wrapper).toHaveStyle({ display: 'flex' });
    });

    it('should have gap between inputs', () => {
      const { container } = render(<OTPInput onChange={mockOnChange} />);

      const wrapper = container.querySelector('div[style*="gap"]');
      expect(wrapper).toHaveStyle({ gap: '8px' });
    });
  });

  describe('validation', () => {
    it('should only accept digits 0-9', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');

      for (let i = 0; i <= 9; i++) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], String(i));
        expect(inputs[0]).toHaveValue(String(i));
      }
    });

    it('should reject letters', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      const letters = ['a', 'b', 'z', 'A', 'Z'];

      for (const letter of letters) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], letter);
        expect(inputs[0]).toHaveValue('');
      }
    });

    it('should reject spaces', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], ' ');

      expect(inputs[0]).toHaveValue('');
    });
  });

  describe('accessibility', () => {
    it('should render inputs as textbox role', () => {
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<OTPInput onChange={mockOnChange} />);

      const inputs = screen.getAllByRole('textbox');
      await user.tab();

      expect(inputs[0]).toHaveFocus();
    });
  });
});
