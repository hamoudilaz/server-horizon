import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger.js';

export function validateDemoSession(req: Request, res: Response, next: NextFunction) {
  const data = req.session.demo;
  if (!data) {
    logger.warn(`Invalid demo session for protected demo route. Path: ${req.originalUrl}, IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid demo session. Please start a new demo.' });
  }
  req.user = {
    ...data,
    pubKey: 'demo-user',
  };
  next();
}
