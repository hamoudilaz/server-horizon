// src/core/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

// This is your new central error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err.stack); // Log the full stack

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    status: '500',
    error: 'Internal Server Error',
    details: err.message, // Only send message in dev?
  });
};
