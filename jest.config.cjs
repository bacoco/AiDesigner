/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.ts$': '<rootDir>/test/support/ts-transformer.js',
  },
};
