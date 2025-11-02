import { Request, Response, NextFunction } from 'express';

export function validateSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    // Return to stop execution
    return res.status(401).json({ error: 'Invalid session' });
  }
  // Call next() to pass to the next middleware or handler
  next();
}
