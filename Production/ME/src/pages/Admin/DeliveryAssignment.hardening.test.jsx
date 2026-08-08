import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/admin/StatusBadge';

describe('Admin StatusBadge — delivery assignment rejected', () => {
  it('labels delivery_partner_rejected distinctly from generic rejected', () => {
    render(<StatusBadge status="delivery_partner_rejected" />);
    expect(screen.getByText('Delivery Partner Rejected')).toBeInTheDocument();
  });
});
