import { clearSmokeAuthRateLimits } from '../helpers/smoke.rate-limit.helper';

export default async function globalSetup() {
  clearSmokeAuthRateLimits();
}
