import path from 'path';

const kbnDir = path.resolve(__dirname, '../../../../');

export default {
  rootDir: path.resolve(__dirname, '../..'),
  roots: [
    '<rootDir>/public',
    '<rootDir>/server'
  ],
  modulePaths: [
    `${kbnDir}/node_modules`
  ],
  collectCoverageFrom: [
    `${kbnDir}/packages/kbn-ui-framework/src/components/**/*.js`,
    `${kbnDir}/!packages/kbn-ui-framework/src/components/index.js`,
    `${kbnDir}/!packages/kbn-ui-framework/src/components/**/*/index.js`,
    `${kbnDir}/packages/kbn-ui-framework/src/services/**/*.js`,
    `${kbnDir}/!packages/kbn-ui-framework/src/services/index.js`,
    `${kbnDir}/!packages/kbn-ui-framework/src/services/**/*/index.js`,
  ],
  moduleNameMapper: {
    '^ui/(.*)': `${kbnDir}/src/ui/public/$1`,
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `${kbnDir}/src/dev/jest/mocks/file_mock.js`,
    '\\.(css|less|scss)$': `${kbnDir}/src/dev/jest/mocks/style_mock.js`,
  },
  setupFiles: [
    `${kbnDir}/src/dev/jest/setup/babel_polyfill.js`,
    `${kbnDir}/src/dev/jest/setup/enzyme.js`,
  ],
  coverageDirectory: `${kbnDir}/target/jest-coverage`,
  coverageReporters: [
    'html',
  ],
  globals: {
    'ts-jest': {
      skipBabel: true,
    },
  },
  moduleFileExtensions: [
    'js',
    'json',
    'ts',
    'tsx',
  ],
  modulePathIgnorePatterns: [
    '__fixtures__/',
    'target/',
  ],
  testMatch: [
    '**/*.test.{js,ts,tsx}'
  ],
  transform: {
    '^.+\\.js$': `${kbnDir}/src/dev/jest/babel_transform.js`,
    '^.+\\.tsx?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.js$',
  ],
  snapshotSerializers: [
    `${kbnDir}/node_modules/enzyme-to-json/serializer`,
  ],
  reporters: [
    'default',
    `${kbnDir}/src/dev/jest/junit_reporter.js`,
  ],
};