/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../..',
  testMatch: [
    '<rootDir>/.dev/test/**/*.test.{js,ts}',
    '<rootDir>/packages/meta-agents/src/__tests__/**/*.test.{js,ts}',
  ],
  transform: {
    '^.+\\.ts$': '<rootDir>/.dev/config/test/support/ts-transformer.js',
  },
};
