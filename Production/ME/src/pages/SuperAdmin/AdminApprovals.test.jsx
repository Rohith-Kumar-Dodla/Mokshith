import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdminApprovals from './AdminApprovals';
import adminApprovalService from '../../services/adminApprovalService';

vi.mock('../../services/adminApprovalService', () => ({
  default: {
    getPending: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

describe('AdminApprovals page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending admins from API', async () => {
    adminApprovalService.getPending.mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Pending Admin',
          email: 'pending@example.com',
          mobile: '9876543210',
          status: 'PENDING',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    render(<AdminApprovals />);

    await waitFor(() => {
      expect(screen.getByText('Pending Admin')).toBeInTheDocument();
    });

    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  it('shows empty state when no pending admins exist', async () => {
    adminApprovalService.getPending.mockResolvedValue({ data: [] });

    render(<AdminApprovals />);

    await waitFor(() => {
      expect(screen.getByText(/No pending registration requests/i)).toBeInTheDocument();
    });
  });
});
