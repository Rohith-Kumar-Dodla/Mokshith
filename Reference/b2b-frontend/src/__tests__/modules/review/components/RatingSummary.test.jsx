import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RatingSummary from '../../../../modules/review/components/RatingSummary.jsx';

describe('RatingSummary', () => {
  it('renders average rating and distribution', () => {
    render(<RatingSummary summary={{ average: 4.5, total: 10, distribution: [{ star: 5, count: 6, percent: 60 }] }} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('10 reviews')).toBeInTheDocument();
  });

  it('renders nothing when summary is null', () => {
    const { container } = render(<RatingSummary summary={null} />);
    expect(container.firstChild).toBeNull();
  });
});
