import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
  };

  if (user.activeSessionId) {
    payload.sessionId = user.activeSessionId;
  } else if (user.sessionId) {
    // allow direct sessionId if provided
    payload.sessionId = user.sessionId;
  }

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};