import { describe, it, expect, beforeEach, vi } from 'vitest';
import adminApprovalService from './adminApprovalService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('adminApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches pending admin approvals', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: [] } });

    await adminApprovalService.getPending();

    expect(api.get).toHaveBeenCalledWith('/admin-approvals/pending');
  });

  it('approves an admin', async () => {
    api.patch.mockResolvedValue({ data: { success: true, data: {} } });

    await adminApprovalService.approve('admin-id');

    expect(api.patch).toHaveBeenCalledWith('/admin-approvals/admin-id/approve');
  });

  it('rejects an admin', async () => {
    api.patch.mockResolvedValue({ data: { success: true, data: {} } });

    await adminApprovalService.reject('admin-id');

    expect(api.patch).toHaveBeenCalledWith('/admin-approvals/admin-id/reject');
  });
});
