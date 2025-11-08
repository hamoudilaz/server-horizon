import { Request, Response, NextFunction } from 'express';
import { logger } from '@horizon/shared';

export function validateSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    logger.warn(`Invalid session for protected route. Path: ${req.originalUrl}, IP: ${req.ip}`);
    return res.status(401).json({ error: 'Invalid session' });
  }
  next();
}
