import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  err: ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = res.locals.requestId as string | undefined;

  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId,
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.errors,
      requestId,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
    message,
    ...(err.details && { details: err.details }),
    ...(requestId && { requestId }),
  });
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message: string, public details?: any) {
    super(message);
  }
}

export class InternalError extends Error {
  statusCode = 500;
  constructor(message: string) {
    super(message);
  }
}
