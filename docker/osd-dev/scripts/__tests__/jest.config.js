const path = require('path');

const testsRoot = __dirname; // docker/osd-dev/scripts/__tests__
const scriptsRoot = path.resolve(testsRoot, '..');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: scriptsRoot,
  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
  verbose: false,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: path.resolve(testsRoot, 'tsconfig.json'),
      },
    ],
  },
};
