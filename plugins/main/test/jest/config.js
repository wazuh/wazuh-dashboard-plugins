import path from 'path';

const kbnDir = path.resolve(__dirname, '../../../../');

export default {
  rootDir: path.resolve(__dirname, '../..'),
  roots: ['<rootDir>/public', '<rootDir>/server', '<rootDir>/common'],
  modulePaths: [`${kbnDir}/node_modules`],
  collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}', './!**/node_modules/**'],
  moduleNameMapper: {
    '@elastic/eui$': `${kbnDir}/node_modules/@elastic/eui/test-env`,
    '@elastic/eui/lib/(.*)?': `${kbnDir}/node_modules/@elastic/eui/test-env/$1`,
    '^ui/(.*)': `${kbnDir}/src/ui/public/$1`,
    // eslint-disable-next-line max-len
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `${kbnDir}/src/dev/jest/mocks/file_mock.js`,
    '\\.(css|less|scss)$': `${kbnDir}/src/dev/jest/mocks/style_mock.js`,
  },
  setupFiles: [
    `${kbnDir}/src/dev/jest/setup/babel_polyfill.js`,
    `${kbnDir}/src/dev/jest/setup/enzyme.js`,
    '<rootDir>/test/__mocks__/localStorage.setup.ts',
  ],
  collectCoverage: true,
  coverageDirectory: './target/test-coverage',
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  globals: {
    'ts-jest': {
      skipBabel: true,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx', 'html'],
  modulePathIgnorePatterns: ['__fixtures__/', 'target/'],
  testMatch: ['**/*.test.{js,ts,tsx}'],
  transform: {
    '^.+\\.js$': `${kbnDir}/src/dev/jest/babel_transform.js`,
    '^.+\\.tsx?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
    '^.+\\.html?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules(?![\\/\\\\](monaco-editor|react-monaco-editor|weak-lru-cache|ordered-binary|d3-color|axios|@smithy|@aws-crypto|@aws-sdk|uuid))[/\\\\].+\\.js$',
  ],
  snapshotSerializers: [`${kbnDir}/node_modules/enzyme-to-json/serializer`],
  testEnvironment: 'jest-environment-jsdom',
  reporters: ['default', `${kbnDir}/src/dev/jest/junit_reporter.js`],
};
