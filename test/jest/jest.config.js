import path from 'path';

const kbnDir = path.resolve(__dirname, '../../../../');

export default {
  rootDir: path.resolve(__dirname, '../..'),
  roots: [
    '<rootDir>/public',
    '<rootDir>/server'
  ],
  modulePathIgnorePatterns: [
    '__fixtures__/',
    'target/',
  ],
  testMatch: [
    '**/*.test.{js,ts,tsx}',
  ],
  transform: {
    '^.+\\.js$': `${kbnDir}/src/dev/jest/babel_transform.js`,
    '^.+\\.tsx?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
    '^.+\\.html?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.js$',
  ],
};