import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchResults from '../../../../modules/search/components/SearchResults.jsx';

describe('SearchResults', () => {
  it('shows empty state when no query', () => {
    render(<MemoryRouter><SearchResults results={{}} activeTab="all" loading={false} query="" /></MemoryRouter>);
    expect(screen.getByText('Start searching')).toBeInTheDocument();
  });

  it('renders product results', () => {
    render(
      <MemoryRouter>
        <SearchResults
          results={{ products: [{ _id: '1', name: 'Rice', price: 1150, categoryId: { name: 'Grains' } }], vendors: [], orders: [] }}
          activeTab="products"
          loading={false}
          query="rice"
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Rice')).toBeInTheDocument();
  });
});
