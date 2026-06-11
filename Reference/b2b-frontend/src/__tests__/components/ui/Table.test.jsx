import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Table, { TableRow, TableCell } from '../../../components/ui/Table.jsx';

describe('Table Component', () => {
  const mockHeaders = ['Name', 'Email', 'Status'];
  
  describe('rendering', () => {
    it('should render table element', () => {
      render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>John Doe</TableCell>
          </TableRow>
        </Table>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render all headers', () => {
      render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </Table>
      );

      mockHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('should render table rows', () => {
      render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </Table>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render multiple rows', () => {
      render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>John Doe</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Johnson</TableCell>
          </TableRow>
        </Table>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should render empty table with headers only', () => {
      render(<Table headers={mockHeaders} />);

      mockHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });
  });

  describe('headers', () => {
    it('should render string headers', () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      render(<Table headers={headers} />);

      headers.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('should render object headers with labels', () => {
      const headers = [
        { label: 'Name', className: 'w-1/3' },
        { label: 'Email', className: 'w-1/3' },
        { label: 'Actions', className: 'w-1/3' },
      ];
      render(<Table headers={headers} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should apply custom className to object headers', () => {
      const headers = [{ label: 'Name', className: 'custom-header' }];
      render(<Table headers={headers} />);

      const headerCell = screen.getByText('Name');
      expect(headerCell).toHaveClass('custom-header');
    });

    it('should apply custom styles to object headers', () => {
      const headers = [{ label: 'Name', style: { width: '200px' } }];
      render(<Table headers={headers} />);

      const headerCell = screen.getByText('Name');
      expect(headerCell).toHaveStyle({ width: '200px' });
    });

    it('should handle mixed header types', () => {
      const headers = ['String Header', { label: 'Object Header' }];
      render(<Table headers={headers} />);

      expect(screen.getByText('String Header')).toBeInTheDocument();
      expect(screen.getByText('Object Header')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className to table', () => {
      const { container } = render(
        <Table headers={mockHeaders} className="custom-table" />
      );

      const table = container.querySelector('table');
      expect(table).toHaveClass('custom-table');
    });

    it('should apply custom containerClassName', () => {
      const { container } = render(
        <Table headers={mockHeaders} containerClassName="custom-container" />
      );

      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toHaveClass('custom-container');
    });

    it('should have default table styles', () => {
      const { container } = render(<Table headers={mockHeaders} />);

      const table = container.querySelector('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('text-left');
      expect(table).toHaveClass('border-collapse');
    });

    it('should have rounded container', () => {
      const { container } = render(<Table headers={mockHeaders} />);

      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toHaveClass('rounded-xl');
    });

    it('should have header styling', () => {
      const { container } = render(<Table headers={mockHeaders} />);

      const thead = container.querySelector('thead tr');
      expect(thead).toHaveClass('bg-gray-50/50');
      expect(thead).toHaveClass('border-b');
    });
  });

  describe('TableRow', () => {
    it('should render table row', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      expect(row).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow className="custom-row">
              <TableCell>Content</TableCell>
            </TableRow>
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveClass('custom-row');
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <table>
          <tbody>
            <TableRow onClick={handleClick}>
              <TableCell>Clickable Row</TableCell>
            </TableRow>
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      await user.click(row);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply cursor pointer when onClick is provided', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow onClick={() => {}}>
              <TableCell>Content</TableCell>
            </TableRow>
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveClass('cursor-pointer');
    });

    it('should have hover effects', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </tbody>
        </table>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveClass('hover:bg-gray-50/50');
      expect(row).toHaveClass('transition-colors');
    });
  });

  describe('TableCell', () => {
    it('should render table cell', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('Cell Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByText('Content');
      expect(cell).toHaveClass('custom-cell');
    });

    it('should support colSpan', () => {
      const { container } = render(
        <table>
          <tbody>
            <tr>
              <TableCell colSpan={3}>Spanning Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = container.querySelector('td');
      expect(cell).toHaveAttribute('colSpan', '3');
    });

    it('should have default cell styles', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const cell = screen.getByText('Content');
      expect(cell).toHaveClass('py-4');
      expect(cell).toHaveClass('px-6');
      expect(cell).toHaveClass('text-sm');
    });
  });

  describe('edge cases', () => {
    it('should handle empty headers array', () => {
      const { container } = render(<Table headers={[]} />);

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle single header', () => {
      render(<Table headers={['Single']} />);

      expect(screen.getByText('Single')).toBeInTheDocument();
    });

    it('should handle many columns', () => {
      const manyHeaders = Array.from({ length: 10 }, (_, i) => `Col ${i + 1}`);
      render(<Table headers={manyHeaders} />);

      manyHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it('should handle special characters in headers', () => {
      const specialHeaders = ['Name & Title', 'Email <address>', 'Status "Active"'];
      render(<Table headers={specialHeaders} />);

      expect(screen.getByText('Name & Title')).toBeInTheDocument();
      expect(screen.getByText('Email <address>')).toBeInTheDocument();
      expect(screen.getByText('Status "Active"')).toBeInTheDocument();
    });

    it('should handle complex cell content', () => {
      render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>
              <div>
                <strong>Bold Text</strong>
                <span>Regular Text</span>
              </div>
            </TableCell>
          </TableRow>
        </Table>
      );

      expect(screen.getByText('Bold Text')).toBeInTheDocument();
      expect(screen.getByText('Regular Text')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should use semantic table elements', () => {
      const { container } = render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </Table>
      );

      expect(container.querySelector('table')).toBeInTheDocument();
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      const { container } = render(
        <Table headers={mockHeaders}>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </Table>
      );

      const table = container.querySelector('table');
      const thead = table.querySelector('thead');
      const tbody = table.querySelector('tbody');

      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
    });
  });

  describe('overflow handling', () => {
    it('should have horizontal scroll on container', () => {
      const { container } = render(<Table headers={mockHeaders} />);

      const wrapper = container.querySelector('.overflow-x-auto');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('overflow-x-auto');
    });
  });
});
