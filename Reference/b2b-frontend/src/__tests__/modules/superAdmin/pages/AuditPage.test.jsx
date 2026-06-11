import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditPage from '../../../../modules/superAdmin/pages/AuditPage.jsx';

vi.mock('../../../../modules/superAdmin/hooks/useAuditLogs.js', () => ({
  useAuditLogs: () => ({
    logs: [{ _id: '1', action: 'USER_CREATED', severity: 'INFO', userEmail: 'a@b.com', entity: 'User', createdAt: new Date().toISOString() }],
    loading: false,
    error: null,
    filters: {},
    selectedLog: null,
    setSelectedLog: vi.fn(),
    updateFilters: vi.fn(),
    exportLogs: vi.fn().mockResolvedValue(new Blob(['csv'])),
    viewLogDetail: vi.fn(),
  }),
}));

describe('AuditPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders audit trail heading and table', () => {
    render(<AuditPage />);
    expect(screen.getByText('System Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<AuditPage />);
    expect(screen.getByText('Export Logs')).toBeInTheDocument();
  });
});
