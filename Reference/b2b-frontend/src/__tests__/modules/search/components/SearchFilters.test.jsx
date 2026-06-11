import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '../../../../modules/search/components/SearchFilters.jsx';

describe('SearchFilters', () => {
  it('renders search input and tabs', () => {
    render(<SearchFilters query="" activeTab="all" onQueryChange={vi.fn()} onTabChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Search products/)).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
  });

  it('calls onTabChange when tab clicked', () => {
    const onTabChange = vi.fn();
    render(<SearchFilters query="" activeTab="all" onQueryChange={vi.fn()} onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('Vendors'));
    expect(onTabChange).toHaveBeenCalledWith('vendors');
  });
});
