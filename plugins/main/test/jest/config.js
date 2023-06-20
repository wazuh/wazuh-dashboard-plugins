const path = require('path');

const kbnDir = path.resolve(__dirname, '../../../../');

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  roots: [
    '<rootDir>/public',
    '<rootDir>/server',
    '<rootDir>/common',
  ],
  modulePaths: [
    `${kbnDir}/node_modules`
  ],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "./!**/node_modules/**",
  ],
  moduleNameMapper: {
    '@elastic/eui/lib/(.*)?': `${kbnDir}/node_modules/@elastic/eui/test-env/$1`,
    '@elastic/eui$': `${kbnDir}/node_modules/@elastic/eui/test-env`,
    '\\.module.(css|scss)$':
      `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/css_module_mock.js`,
    '\\.(css|less|scss)$': `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/style_mock.js`,
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/file_mock.js`,
    '\\.ace\\.worker.js$':
      `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/worker_module_mock.js`,
    '\\.editor\\.worker.js$':
      `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/worker_module_mock.js`,
    '^(!!)?file-loader!': `${kbnDir}/node_modules/@kbn/test/target_node/jest/mocks/file_mock.js`,
    '^src/core/(.*)': `${kbnDir}/src/core/$1`,
    '^src/plugins/(.*)': `${kbnDir}/src/plugins/$1`,
  },
  setupFiles: [
    `${kbnDir}/node_modules/@kbn/test/target_node/jest/setup/babel_polyfill.js`,
    `${kbnDir}/node_modules/@kbn/test/target_node/jest/setup/enzyme.js`,
  ],
  collectCoverage: true,
  coverageDirectory: `./target/test-coverage`,
  coverageReporters: [
    'html',
    'text-summary',
    'json-summary'
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
    'html'
  ],
  modulePathIgnorePatterns: [
    '__fixtures__/',
    'target/',
  ],
  testMatch: [
    '**/*.test.{js,ts,tsx}',
  ],
  transform: {
    '^.+\\.(js|tsx?)$': `${kbnDir}/node_modules/@kbn/test/target_node/jest/babel_transform.js`,
    '^.+\\.html?$': 'jest-raw-loader',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.js$',
  ],
  snapshotSerializers: [
    `${kbnDir}/node_modules/enzyme-to-json/serializer`,
  ],
  reporters: [
    'default',
    `${kbnDir}/node_modules/@kbn/test/target_node/jest/junit_reporter`,
  ],
};
