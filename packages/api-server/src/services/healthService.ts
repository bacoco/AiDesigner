import os from 'node:os';
import process from 'node:process';
import { projectService } from './projectService';

export type HealthStatus = 'pass' | 'warn' | 'fail';

export interface HealthCheckResult {
  componentId: string;
  componentType: string;
  status: HealthStatus;
  observedValue?: Record<string, unknown>;
  details?: Record<string, unknown>;
  time: string;
}

export interface HealthSummary {
  status: HealthStatus;
  timestamp: string;
  uptimeMs: number;
}

export interface ReadinessReport extends HealthSummary {
  checks: Record<string, HealthCheckResult>;
  info: Record<string, unknown>;
}

export interface DetailedHealthReport extends ReadinessReport {
  metrics: Record<string, unknown>;
}

const startedAt = Date.now();

function getUptimeMs(): number {
  return Date.now() - startedAt;
}

function createCheck(
  componentId: string,
  componentType: string,
  status: HealthStatus,
  observedValue?: Record<string, unknown>,
  details?: Record<string, unknown>
): HealthCheckResult {
  return {
    componentId,
    componentType,
    status,
    observedValue,
    details,
    time: new Date().toISOString(),
  };
}

function deriveOverallStatus(checks: Record<string, HealthCheckResult>): HealthStatus {
  const statuses = Object.values(checks).map((check) => check.status);
  if (statuses.includes('fail')) {
    return 'fail';
  }
  if (statuses.includes('warn')) {
    return 'warn';
  }
  return 'pass';
}

function checkProcessResources(): HealthCheckResult {
  const memoryUsage = process.memoryUsage();
  const loadAverage = os.loadavg();
  const maxHeapBytes = Math.max(0, parseInt(process.env.HEALTH_MAX_HEAP_BYTES || '0', 10)) || 0;
  const heapWarning =
    maxHeapBytes > 0 && memoryUsage.heapUsed > maxHeapBytes * 0.8 ? 'approaching-threshold' : undefined;

  const status: HealthStatus = heapWarning ? 'warn' : 'pass';

  return createCheck(
    'process-resources',
    'system',
    status,
    {
      rssBytes: memoryUsage.rss,
      heapUsedBytes: memoryUsage.heapUsed,
      heapTotalBytes: memoryUsage.heapTotal,
      externalBytes: memoryUsage.external,
      arrayBuffersBytes: memoryUsage.arrayBuffers,
      loadAverage,
      maxHeapBytes: maxHeapBytes || undefined,
    },
    heapWarning ? { message: 'Process heap usage is nearing configured threshold' } : undefined
  );
}

function checkProjectService(): HealthCheckResult {
  const healthStatus = projectService.getHealthStatus();

  return createCheck(
    'project-service',
    'internal-service',
    healthStatus.status,
    {
      ...healthStatus.metrics,
    },
    {
      moduleExists: healthStatus.moduleExists,
      cleanupTimerActive: healthStatus.cleanupTimerActive,
      missingMethods: healthStatus.missingMethods,
    }
  );
}

export function getHealthSummary(): HealthSummary {
  return {
    status: 'pass',
    timestamp: new Date().toISOString(),
    uptimeMs: getUptimeMs(),
  };
}

export function getReadinessReport(): ReadinessReport {
  const checks = {
    projectService: checkProjectService(),
    processResources: checkProcessResources(),
  } satisfies Record<string, HealthCheckResult>;

  return {
    status: deriveOverallStatus(checks),
    timestamp: new Date().toISOString(),
    uptimeMs: getUptimeMs(),
    info: {
      environment: process.env.NODE_ENV ?? 'development',
    },
    checks,
  };
}

export function getDetailedHealthReport(): DetailedHealthReport {
  const readiness = getReadinessReport();
  const cpuUsage = process.cpuUsage();

  const metrics = {
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    uptimeMs: readiness.uptimeMs,
    cpuUserMicros: cpuUsage.user,
    cpuSystemMicros: cpuUsage.system,
    pid: process.pid,
    platform: process.platform,
    versions: process.versions,
  } satisfies Record<string, unknown>;

  return {
    ...readiness,
    metrics,
  };
}
