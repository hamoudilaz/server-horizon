import { Request, Response, NextFunction } from 'express';

export function validateDemoSession(req: Request, res: Response, next: NextFunction) {
  const data = req.session.demo;
  if (!data) {
    return res.status(401).json({ error: 'Invalid demo session. Please start a new demo.' });
  }
  // This is where you attach 'user' to the Express Request object
  req.user = {
    ...data,
    pubKey: 'demo-user',
  };
  next();
}
