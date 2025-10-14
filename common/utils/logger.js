/**
 * Structured Logger for AiDesigner
 *
 * Provides consistent logging across the application with:
 * - Log levels (ERROR, WARN, INFO, DEBUG)
 * - Structured output (JSON in production, formatted in development)
 * - Performance tracking
 * - Context enrichment
 */

// eslint-disable-next-line unicorn/prefer-module
const fs = require('node:fs');
// eslint-disable-next-line unicorn/prefer-module
const path = require('node:path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    this.level = this.getLogLevel();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logDir = path.join(process.cwd(), 'logs');

    // Ensure log directory exists
    if (this.isProduction && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogLevel() {
    const envLevel = process.env.LOG_LEVEL || 'INFO';
    return LOG_LEVELS[envLevel.toUpperCase()] ?? LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isProduction) {
      // JSON format for production (structured logging)
      return JSON.stringify(logEntry);
    } else {
      // Human-readable format for development
      const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
      return `[${timestamp}] ${level}: ${message}${contextStr}`;
    }
  }

  writeLog(level, message, context) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    if (this.isProduction) {
      // Write to file in production
      const logFile = path.join(
        this.logDir,
        `aidesigner-${new Date().toISOString().split('T')[0]}.log`,
      );
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } else {
      // Console output in development (but structured)
      const colors = {
        ERROR: '\u001B[31m', // Red
        WARN: '\u001B[33m', // Yellow
        INFO: '\u001B[36m', // Cyan
        DEBUG: '\u001B[90m', // Gray
      };
      const reset = '\u001B[0m';
      console.log(`${colors[level] || ''}${formattedMessage}${reset}`);
    }
  }

  error(message, context = {}) {
    this.writeLog('ERROR', message, context);
  }

  warn(message, context = {}) {
    this.writeLog('WARN', message, context);
  }

  info(message, context = {}) {
    this.writeLog('INFO', message, context);
  }

  debug(message, context = {}) {
    this.writeLog('DEBUG', message, context);
  }

  // Performance logging helper
  time(label) {
    const start = process.hrtime.bigint();
    return {
      end: (context = {}) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
        this.info(`Performance: ${label}`, { duration: `${duration.toFixed(2)}ms`, ...context });
        return duration;
      },
    };
  }
}

// Export singleton instance
// eslint-disable-next-line unicorn/prefer-module
module.exports = new Logger();

// Also export the class for testing
// eslint-disable-next-line unicorn/prefer-module
module.exports.Logger = Logger;
