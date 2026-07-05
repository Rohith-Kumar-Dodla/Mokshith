// Centralized environment metadata mapping
// This file is the single source of truth for environment names and expected DBs.
export const environments = {
  development: {
    name: 'development',
    databaseName: 'mokshith-dev',
    description: 'Local development environment',
  },
  qa: {
    name: 'qa',
    databaseName: 'mokshith-qa',
    description: 'Quality Assurance (Playwright / automation) environment',
  },
  uat: {
    name: 'uat',
    databaseName: 'mokshith-uat',
    description: 'User Acceptance Testing environment',
  },
  production: {
    name: 'production',
    databaseName: 'mokshith-production',
    description: 'Live production environment',
  },
  test: {
    name: 'test',
    databaseName: 'mokshith-test',
    description: 'Unit / integration test environment (or in-memory)',
  },
};

export default environments;

