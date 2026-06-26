const sharedConfig = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/docs/**',
    '!src/config/**',
    '!src/constants/**',
    '!src/errors/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/modules/payment/**/*.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/inventory/**/*.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/order/**/*.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/modules/auth/**/*.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: false,
  forceExit: false,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  transform: {
    '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-syntax-import-meta'] }],
  },
  globals: {
    __DEV__: true,
    'babel-jest': {
      useESM: true,
    },
  },
};

module.exports = {
  ...sharedConfig,
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['**/tests/unit/**/*.test.js'],
      maxWorkers: '50%',
    },
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['**/tests/integration/**/*.test.js'],
      maxWorkers: 1,
    },
  ],
};
