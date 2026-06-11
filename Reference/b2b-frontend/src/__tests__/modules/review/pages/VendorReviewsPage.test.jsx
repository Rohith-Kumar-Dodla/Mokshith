import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VendorReviewsPage from '../../../../modules/review/pages/VendorReviewsPage.jsx';

vi.mock('../../../../modules/review/hooks/useReviews.js', () => ({
  useReviews: () => ({
    reviews: [{ _id: '1', userId: { name: 'John' }, productName: 'Rice', rating: 5, comment: 'Great product', createdAt: new Date().toISOString() }],
    summary: { average: 4.5, total: 1, distribution: [{ star: 5, count: 1, percent: 100 }] },
    loading: false,
    error: null,
    selectedReview: null,
    setSelectedReview: vi.fn(),
  }),
}));

describe('VendorReviewsPage', () => {
  it('renders product reviews heading', () => {
    render(<VendorReviewsPage />);
    expect(screen.getByText('Product Reviews')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Great product')).toBeInTheDocument();
  });
});
