import { simulateApi, filterByQuery, exportToCsv, generateId } from '../../../mocks/mockApi.js';
import { mockAuditLogs } from '../../../mocks/data/index.js';

let auditStore = [...mockAuditLogs];

export const auditService = {
  async getAuditLogs(filters = {}) {
    return simulateApi(() => {
      let logs = [...auditStore];
      if (filters.action) logs = logs.filter((l) => l.action === filters.action);
      if (filters.severity) logs = logs.filter((l) => l.severity === filters.severity);
      if (filters.userId) logs = logs.filter((l) => l.userId?._id === filters.userId);
      if (filters.search) {
        logs = filterByQuery(logs, filters.search, ['action', 'entity', 'details', 'userEmail', 'userId.name']);
      }
      if (filters.limit) logs = logs.slice(0, Number(filters.limit));
      return logs;
    });
  },

  async getAuditLogById(id) {
    return simulateApi(() => {
      const log = auditStore.find((l) => l._id === id);
      if (!log) throw new Error('Audit log not found');
      return log;
    });
  },

  async exportAuditLogs(filters = {}) {
    const logs = await this.getAuditLogs(filters);
    const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Entity', 'Details', 'IP', 'Severity'];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.userId?.name || 'System',
      log.userEmail,
      log.role,
      log.action,
      log.entity,
      log.details,
      log.ip,
      log.severity,
    ]);
    return simulateApi(() => exportToCsv(headers, rows));
  },
};
