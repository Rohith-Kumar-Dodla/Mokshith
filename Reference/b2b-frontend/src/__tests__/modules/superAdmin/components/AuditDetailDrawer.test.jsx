import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditDetailDrawer from '../../../../modules/superAdmin/components/AuditDetailDrawer.jsx';

const mockLog = {
  _id: 'audit-1',
  action: 'USER_CREATED',
  severity: 'INFO',
  userEmail: 'test@example.com',
  userId: { name: 'Test User' },
  role: 'ADMIN',
  entity: 'User',
  details: 'Created user',
  ip: '127.0.0.1',
  createdAt: new Date().toISOString(),
};

describe('AuditDetailDrawer', () => {
  it('renders log details when open', () => {
    render(<AuditDetailDrawer log={mockLog} isOpen onClose={vi.fn()} />);
    expect(screen.getByText('USER_CREATED')).toBeInTheDocument();
    expect(screen.getByText('Created user')).toBeInTheDocument();
  });

  it('renders nothing when log is null', () => {
    const { container } = render(<AuditDetailDrawer log={null} isOpen onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
