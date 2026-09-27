import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusBadge from './StatusBadge';

describe('Vendor StatusBadge', () => {
  it.each([
    ['paid', 'Paid'],
    ['pending', 'Pending'],
    ['failed', 'Failed'],
    ['cancelled', 'Cancelled'],
  ])('renders %s exactly once', (status, label) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label).parentElement).toHaveTextContent(new RegExp(`^${label}$`));
  });
});
