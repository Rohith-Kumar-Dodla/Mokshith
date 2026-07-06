import { verifyEnvironment } from '../environmentVerifier.js';
import { verifyBuilder } from '../builderVerifier.js';

test('integration basic verifiers (mock)', () => {
  const repoRoot = process.cwd();
  const envRes = verifyEnvironment({ repoRoot, env: { NODE_ENV: 'development', TARGET_DATABASE: 'mokshith-dev', MANIFEST_VERSION: 'v1' }, logger: console });
  const builderRes = verifyBuilder({ repoRoot, logger: console });
  expect(envRes.checks).toBeDefined();
  expect(builderRes.checks).toBeDefined();
});

