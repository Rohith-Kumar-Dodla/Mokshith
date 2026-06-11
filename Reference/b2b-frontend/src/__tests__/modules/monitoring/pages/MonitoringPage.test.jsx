import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonitoringPage from '../../../../modules/monitoring/pages/MonitoringPage.jsx';

vi.mock('../../../../modules/monitoring/hooks/useMonitoring.js', () => ({
  useMonitoring: () => ({
    health: { status: 'healthy', uptime: 864000, environment: 'development', version: '1.0.0', checks: { database: { status: 'healthy' } } },
    metrics: { metrics: { application: { totalRequests: 1000, errorRate: 0.01 }, memory: { heapUsagePercent: 45 }, cache: { cacheHitRate: 94 } }, alerts: [], alertCount: 0 },
    businessMetrics: { totalUsers: 100, activeVendors: 10, ordersToday: 5, revenueToday: 100000, pendingApprovals: 2 },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('MonitoringPage', () => {
  it('renders platform health heading', () => {
    render(<MonitoringPage />);
    expect(screen.getByText('Platform Health')).toBeInTheDocument();
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
  });
});
