import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

const DEFAULT_SLOW_REQUEST_THRESHOLD_MS = 1_000;

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const requestId = crypto.randomUUID();
  const configuredThreshold = Number(process.env.SLOW_REQUEST_THRESHOLD_MS);
  const slowThreshold = Number.isFinite(configuredThreshold) && configuredThreshold > 0
    ? configuredThreshold
    : DEFAULT_SLOW_REQUEST_THRESHOLD_MS;

  res.locals.requestId = requestId;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const logPayload = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get('user-agent') ?? 'unknown',
      contentLength: res.getHeader('content-length'),
    };

    const logMethod = durationMs > slowThreshold ? logger.warn.bind(logger) : logger.info.bind(logger);
    logMethod('HTTP Request', logPayload);
  });

  res.on('close', () => {
    if (!res.writableFinished) {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      logger.warn('HTTP Request closed before completion', {
        requestId,
        method: req.method,
        path: req.originalUrl || req.path,
        durationMs: Number(durationMs.toFixed(2)),
      });
    }
  });

  next();
}
