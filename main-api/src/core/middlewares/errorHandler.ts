// src/core/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@horizon/shared';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, reqId: (req as unknown as { id?: string }).id }, `Unhandled Error: ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    status: '500',
    error: 'Internal Server Error',
    details: err.message,
  });
};
