// src/core/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger.js';

// This is your new central error handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, reqId: (req as Request).id }, `Unhandled Error: ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    status: '500',
    error: 'Internal Server Error',
    details: err.message,
  });
};
