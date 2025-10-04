/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/.dev/test/**/*.test.{js,ts}'],
  transform: {
    '^.+\\.ts$': '<rootDir>/.dev/config/test/support/ts-transformer.js',
  },
};
