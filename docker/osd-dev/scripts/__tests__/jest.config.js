const path = require('path');

const testsRoot = __dirname; // docker/osd-dev/scripts/__tests__
const scriptsRoot = path.resolve(testsRoot, '..');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: scriptsRoot,
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  verbose: false,
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/jest.setup.ts',
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: path.resolve(testsRoot, 'tsconfig.json'),
      },
    ],
  },
};
