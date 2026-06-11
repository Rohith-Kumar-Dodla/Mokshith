import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { auditService } from '../../../../modules/superAdmin/services/auditService.js';

describe('auditService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getAuditLogs returns array of logs', async () => {
    const promise = auditService.getAuditLogs();
    await vi.runAllTimersAsync();
    const logs = await promise;
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('getAuditLogs filters by severity', async () => {
    const promise = auditService.getAuditLogs({ severity: 'CRITICAL' });
    await vi.runAllTimersAsync();
    const logs = await promise;
    logs.forEach((log) => expect(log.severity).toBe('CRITICAL'));
  });

  it('exportAuditLogs returns blob', async () => {
    const promise = auditService.exportAuditLogs();
    await vi.runAllTimersAsync();
    const blob = await promise;
    expect(blob).toBeInstanceOf(Blob);
  });
});
