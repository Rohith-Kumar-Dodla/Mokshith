import express from 'express';
import v1Routes from './v1.routes.js';
import v2Routes from './v2.routes.js';

const router = express.Router();

// Versioning
// Mount v1 routes at both /v1 and root to preserve backward compatibility
// with older tests/clients that hit /api/<module> instead of /api/v1/<module>.
router.use('/v1', v1Routes);
router.use('/', v1Routes);
router.use('/v2', v2Routes);

export default router;