import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../../components/ui/Badge.jsx';

describe('Badge Component', () => {
  describe('rendering', () => {
    it('should render children text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('should render with default variant (blue)', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('bg-blue-50');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('should render with default size (md)', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
    });
  });

  describe('variants', () => {
    it('should render blue variant', () => {
      render(<Badge variant="blue">Blue</Badge>);
      const badge = screen.getByText('Blue');
      expect(badge).toHaveClass('bg-blue-50');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('should render emerald variant', () => {
      render(<Badge variant="emerald">Emerald</Badge>);
      const badge = screen.getByText('Emerald');
      expect(badge).toHaveClass('bg-emerald-50');
      expect(badge).toHaveClass('text-emerald-700');
    });

    it('should render rose variant', () => {
      render(<Badge variant="rose">Rose</Badge>);
      const badge = screen.getByText('Rose');
      expect(badge).toHaveClass('bg-rose-50');
      expect(badge).toHaveClass('text-rose-700');
    });

    it('should render amber variant', () => {
      render(<Badge variant="amber">Amber</Badge>);
      const badge = screen.getByText('Amber');
      expect(badge).toHaveClass('bg-amber-50');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('should render indigo variant', () => {
      render(<Badge variant="indigo">Indigo</Badge>);
      const badge = screen.getByText('Indigo');
      expect(badge).toHaveClass('bg-indigo-50');
      expect(badge).toHaveClass('text-indigo-700');
    });

    it('should render gray variant', () => {
      render(<Badge variant="gray">Gray</Badge>);
      const badge = screen.getByText('Gray');
      expect(badge).toHaveClass('bg-gray-50');
      expect(badge).toHaveClass('text-gray-600');
    });

    it('should render violet variant', () => {
      render(<Badge variant="violet">Violet</Badge>);
      const badge = screen.getByText('Violet');
      expect(badge).toHaveClass('bg-violet-50');
      expect(badge).toHaveClass('text-violet-700');
    });

    it('should render orange variant', () => {
      render(<Badge variant="orange">Orange</Badge>);
      const badge = screen.getByText('Orange');
      expect(badge).toHaveClass('bg-orange-50');
      expect(badge).toHaveClass('text-orange-700');
    });

    it('should fallback to blue for invalid variant', () => {
      render(<Badge variant="invalid">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('bg-blue-50');
      expect(badge).toHaveClass('text-blue-700');
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-[10px]');
    });

    it('should render medium size', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render large size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-4');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('text-sm');
    });

    it('should fallback to medium for invalid size', () => {
      render(<Badge size="invalid">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
    });
  });

  describe('dot indicator', () => {
    it('should not render dot by default', () => {
      const { container } = render(<Badge>Badge</Badge>);
      const dot = container.querySelector('.animate-pulse');
      expect(dot).not.toBeInTheDocument();
    });

    it('should render dot when dot prop is true', () => {
      const { container } = render(<Badge dot>Badge</Badge>);
      const dot = container.querySelector('.animate-pulse');
      expect(dot).toBeInTheDocument();
    });

    it('should render blue dot for blue variant', () => {
      const { container } = render(
        <Badge variant="blue" dot>
          Badge
        </Badge>
      );
      const dot = container.querySelector('.bg-blue-500');
      expect(dot).toBeInTheDocument();
    });

    it('should render emerald dot for emerald variant', () => {
      const { container } = render(
        <Badge variant="emerald" dot>
          Badge
        </Badge>
      );
      const dot = container.querySelector('.bg-emerald-500');
      expect(dot).toBeInTheDocument();
    });

    it('should have pulse animation on dot', () => {
      const { container } = render(<Badge dot>Badge</Badge>);
      const dot = container.querySelector('.animate-pulse');
      expect(dot).toHaveClass('animate-pulse');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should have uppercase text', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('uppercase');
    });

    it('should have rounded corners', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should have border', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('border');
    });

    it('should have font styling', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('font-black');
      expect(badge).toHaveClass('tracking-wider');
    });
  });

  describe('additional props', () => {
    it('should pass through additional props', () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      expect(screen.getByTestId('test-badge')).toBeInTheDocument();
    });

    it('should support onClick handler', () => {
      const handleClick = vi.fn();
      render(<Badge onClick={handleClick}>Badge</Badge>);
      const badge = screen.getByText('Badge');
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should support custom attributes', () => {
      render(<Badge aria-label="status badge">Badge</Badge>);
      expect(screen.getByLabelText('status badge')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<Badge />);
      const badge = container.firstChild;
      expect(badge).toBeInTheDocument();
    });

    it('should handle numeric children', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle long text', () => {
      render(<Badge>Very Long Badge Text That Might Wrap</Badge>);
      expect(screen.getByText(/Very Long Badge Text/)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>Status: #1 & Active!</Badge>);
      expect(screen.getByText(/Status: #1 & Active!/)).toBeInTheDocument();
    });

    it('should combine variant and size', () => {
      render(
        <Badge variant="emerald" size="lg">
          Large Green
        </Badge>
      );
      const badge = screen.getByText('Large Green');
      expect(badge).toHaveClass('bg-emerald-50');
      expect(badge).toHaveClass('px-4');
    });

    it('should combine all props', () => {
      render(
        <Badge variant="rose" size="sm" dot className="extra-class">
          Complete
        </Badge>
      );
      const badge = screen.getByText('Complete');
      expect(badge).toHaveClass('bg-rose-50');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('extra-class');
    });
  });

  describe('accessibility', () => {
    it('should render as inline element', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should support aria-label', () => {
      render(<Badge aria-label="Status indicator">Active</Badge>);
      expect(screen.getByLabelText('Status indicator')).toBeInTheDocument();
    });
  });
});
