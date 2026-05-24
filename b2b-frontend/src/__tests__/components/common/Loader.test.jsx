import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loader from '../../../components/common/Loader.jsx';

describe('Loader Component', () => {
  describe('rendering', () => {
    it('should render loader', () => {
      const { container } = render(<Loader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render spinner element', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have spinner with correct styling', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full');
      expect(spinner).toHaveClass('h-12');
      expect(spinner).toHaveClass('w-12');
      expect(spinner).toHaveClass('border-b-2');
      expect(spinner).toHaveClass('border-blue-600');
    });
  });

  describe('container', () => {
    it('should have flex container', () => {
      const { container } = render(<Loader />);
      const wrapper = container.querySelector('.flex');
      expect(wrapper).toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(<Loader />);
      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should have minimum height', () => {
      const { container } = render(<Loader />);
      const wrapper = container.querySelector('.flex');
      expect(wrapper).toHaveClass('min-h-[200px]');
    });
  });

  describe('animation', () => {
    it('should have spin animation class', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('styling', () => {
    it('should be circular', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('should have blue border', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-blue-600');
    });

    it('should have correct size', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-12');
      expect(spinner).toHaveClass('w-12');
    });

    it('should have bottom border only', () => {
      const { container } = render(<Loader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-b-2');
    });
  });

  describe('accessibility', () => {
    it('should be visible', () => {
      const { container } = render(<Loader />);
      const loader = container.firstChild;
      expect(loader).toBeVisible();
    });

    it('should render as div element', () => {
      const { container } = render(<Loader />);
      const wrapper = container.querySelector('.flex');
      expect(wrapper.tagName).toBe('DIV');
    });
  });

  describe('edge cases', () => {
    it('should render consistently', () => {
      const { container: container1 } = render(<Loader />);
      const { container: container2 } = render(<Loader />);

      const spinner1 = container1.querySelector('.animate-spin');
      const spinner2 = container2.querySelector('.animate-spin');

      expect(spinner1.className).toBe(spinner2.className);
    });

    it('should maintain structure on re-render', () => {
      const { container, rerender } = render(<Loader />);
      const initialSpinner = container.querySelector('.animate-spin');

      rerender(<Loader />);
      const rerenderedSpinner = container.querySelector('.animate-spin');

      expect(initialSpinner).toBeTruthy();
      expect(rerenderedSpinner).toBeTruthy();
    });
  });

  describe('multiple instances', () => {
    it('should render multiple loaders independently', () => {
      render(
        <div>
          <Loader />
          <Loader />
          <Loader />
        </div>
      );

      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners).toHaveLength(3);
    });
  });
});
