/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.ts$': '<rootDir>/.dev/test/support/ts-transformer.js',
  },
};
