import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../../components/ui/Card.jsx';

describe('Card Component', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render with subtitle', () => {
      render(<Card subtitle="Card Subtitle">Content</Card>);
      expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    });

    it('should render with both title and subtitle', () => {
      render(
        <Card title="Title" subtitle="Subtitle">
          Content
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('should render with footer', () => {
      render(<Card footer={<button>Action</button>}>Content</Card>);
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('should pass through additional props', () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('should render without title/subtitle section when not provided', () => {
      const { container } = render(<Card>Content</Card>);
      const headers = container.querySelectorAll('.border-b');
      expect(headers).toHaveLength(0);
    });

    it('should render without footer section when not provided', () => {
      const { container } = render(<Card>Content</Card>);
      const footers = container.querySelectorAll('.border-t');
      expect(footers).toHaveLength(0);
    });
  });

  describe('styling', () => {
    it('should have default card styles', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-[2rem]');
      expect(card).toHaveClass('shadow-sm');
    });

    it('should have hover effects', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-2xl');
      expect(card).toHaveClass('hover:-translate-y-1');
    });

    it('should have transition effects', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-500');
    });
  });

  describe('structure', () => {
    it('should have correct content padding', () => {
      const { container } = render(<Card>Content</Card>);
      const content = container.querySelector('.p-8');
      expect(content).toBeInTheDocument();
    });

    it('should render title section with correct styling', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      const titleSection = container.querySelector('.px-8.py-6.border-b');
      expect(titleSection).toBeInTheDocument();
    });

    it('should render footer section with correct styling', () => {
      const { container } = render(<Card footer="Footer">Content</Card>);
      const footerSection = container.querySelector('.px-8.py-6.bg-gray-50\\/30');
      expect(footerSection).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      render(<Card />);
      const { container } = render(<Card />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <Card>
          <p>First</p>
          <p>Second</p>
          <p>Third</p>
        </Card>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should handle complex footer content', () => {
      render(
        <Card
          footer={
            <div>
              <button>Cancel</button>
              <button>Confirm</button>
            </div>
          }
        >
          Content
        </Card>
      );
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('should handle empty string title', () => {
      render(<Card title="">Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle empty string subtitle', () => {
      render(<Card subtitle="">Content</Card>);
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render semantic HTML', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      expect(container.querySelector('h3')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<Card title="Card Title">Content</Card>);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Card Title');
    });
  });
});
