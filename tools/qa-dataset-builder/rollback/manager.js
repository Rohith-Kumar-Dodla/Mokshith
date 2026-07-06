export class RollbackManager {
  constructor({ logger }) {
    this.logger = logger;
  }

  async prepareSnapshot() {
    this.logger?.info('RollbackManager.prepareSnapshot: not implemented (framework only)');
  }

  async rollbackToSnapshot(snapshotId) {
    this.logger?.info('RollbackManager.rollbackToSnapshot: not implemented (framework only)');
  }
}

export default RollbackManager;

