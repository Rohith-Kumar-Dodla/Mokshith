const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  projects: [
    {
      ...base.projects[1],
      displayName: 'infrastructure',
      testMatch: ['**/tests/infrastructure/**/*.test.js'],
      maxWorkers: 1,
    },
  ],
};
