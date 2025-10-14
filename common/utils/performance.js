/**
 * Simple performance monitoring utilities
 */

// eslint-disable-next-line unicorn/prefer-module
const logger = require('./logger');

/**
 * Create a timer for measuring operation duration
 * @param {string} operation - Name of the operation being timed
 * @returns {Function} Function to call when operation completes
 */
function createTimer(operation) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  return function stopTimer() {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    logger.debug(`Performance: ${operation} completed`, {
      duration: `${duration}ms`,
      memoryDelta: formatBytes(memoryDelta),
      operation,
    });

    return {
      operation,
      duration,
      memoryDelta,
      startTime,
      endTime,
    };
  };
}

/**
 * Format bytes in human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  const formatted = Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  const sign = bytes < 0 ? '-' : '+';

  return `${sign}${formatted} ${sizes[i]}`;
}

/**
 * Simple progress indicator for long operations
 * @param {string} message - Progress message
 * @returns {Function} Function to call when done
 */
function showProgress(message) {
  if (!process.stdout.isTTY) {
    console.log(`⏳ ${message}...`);
    return () => console.log(`✅ ${message} completed`);
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${message}...`);
    i = (i + 1) % frames.length;
  }, 100);

  return function done() {
    clearInterval(interval);
    process.stdout.write(`\r✅ ${message} completed\n`);
  };
}

// eslint-disable-next-line unicorn/prefer-module
module.exports = {
  createTimer,
  formatBytes,
  showProgress,
};
