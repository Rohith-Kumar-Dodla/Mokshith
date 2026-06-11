import express from 'express';
import config from '../config/environment.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

export default router;
