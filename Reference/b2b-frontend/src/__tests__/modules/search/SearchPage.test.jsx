import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchPage from '../../../modules/search/SearchPage.jsx';

vi.mock('../../../modules/search/hooks/useSearch.js', () => ({
  useSearch: () => ({
    results: { products: [], vendors: [], orders: [] },
    loading: false,
    query: '',
    activeTab: 'all',
    search: vi.fn(),
    changeTab: vi.fn(),
  }),
}));

describe('SearchPage', () => {
  it('renders global search heading', () => {
    render(<SearchPage />);
    expect(screen.getByText('Global Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products/)).toBeInTheDocument();
  });
});
