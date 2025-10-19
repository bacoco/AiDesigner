import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import {
  DetailedHealthReport,
  ReadinessReport,
  getDetailedHealthReport,
  getHealthSummary,
  getReadinessReport,
} from '../services/healthService';

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createHealthRouter(): Router {
  const router = Router();

  router.get(
    '/health',
    asyncHandler(async (_req, res) => {
      res.json(getHealthSummary());
    })
  );

  router.get(
    '/health/ready',
    asyncHandler(async (_req, res) => {
      const report: ReadinessReport = getReadinessReport();
      const statusCode = report.status === 'fail' ? 503 : 200;
      res.status(statusCode).json(report);
    })
  );

  router.get(
    '/health/detailed',
    asyncHandler(async (_req, res) => {
      const report: DetailedHealthReport = getDetailedHealthReport();
      const statusCode = report.status === 'fail' ? 503 : 200;
      res.status(statusCode).json(report);
    })
  );

  return router;
}
