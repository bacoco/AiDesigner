import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaEntries = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `[${timestamp}] ${level}: ${message}${metaEntries}\n${stack}`;
    }
    return `[${timestamp}] ${level}: ${message}${metaEntries}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: process.env.CONSOLE_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
    format: consoleFormat,
  }),
];

if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: 'aidesigner-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: process.env.LOG_MAX_FILES || '30d',
      level: process.env.FILE_LOG_LEVEL || process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(baseFormat, winston.format.json()),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'api-server' },
  format: baseFormat,
  transports,
});

logger.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('Logger transport error', error);
});
