import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServiceStatusCard from '../../../../modules/monitoring/components/ServiceStatusCard.jsx';

describe('ServiceStatusCard', () => {
  it('renders service name and status', () => {
    render(<ServiceStatusCard name="database" status="healthy" details={{ responseTime: 12 }} />);
    expect(screen.getByText('database')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });
});
