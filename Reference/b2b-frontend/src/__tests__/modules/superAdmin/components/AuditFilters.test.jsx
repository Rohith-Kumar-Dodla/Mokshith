import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuditFilters from '../../../../modules/superAdmin/components/AuditFilters.jsx';

describe('AuditFilters', () => {
  it('renders search and filter controls', () => {
    render(<AuditFilters filters={{}} onFilterChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search logs...')).toBeInTheDocument();
    expect(screen.getByText('All Severities')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    const onFilterChange = vi.fn();
    render(<AuditFilters filters={{}} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search logs...'), { target: { value: 'login' } });
    expect(onFilterChange).toHaveBeenCalledWith({ search: 'login' });
  });
});
