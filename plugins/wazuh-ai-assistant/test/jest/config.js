import path from 'path';

const kbnDir = path.resolve(__dirname, '../../../../');
const rootDir = path.resolve(__dirname, '../..');

const sharedTransform = {
  '^.+\\.js$': `${kbnDir}/src/dev/jest/babel_transform.js`,
  '^.+\\.tsx?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
};

/**
 * Pure-logic suite, colocated beside the modules it tests under common/ and server/. Runs under
 * `testEnvironment: 'node'` (no DOM) — this is the tier that existed before component coverage was
 * added, unchanged.
 */
const nodeProject = {
  displayName: 'node',
  rootDir,
  roots: ['<rootDir>/common', '<rootDir>/server'],
  testEnvironment: 'node',
  setupFiles: [path.resolve(__dirname, 'setup.js')],
  modulePaths: [`${kbnDir}/node_modules`],
  globals: {
    'ts-jest': {
      skipBabel: true,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  modulePathIgnorePatterns: ['__fixtures__/', 'target/'],
  testMatch: ['**/*.test.ts'],
  transform: sharedTransform,
};

/**
 * React component/hook/browser-service suite, colocated beside the modules it tests under public/.
 * Needs a real DOM (rendering, hooks, `window.fetch`), hence a separate jsdom project rather than
 * switching the whole config to jsdom — see wazuh-check-updates/wazuh-core's own test/jest/config.js
 * for the moduleNameMapper/snapshotSerializers/testEnvironment conventions this mirrors.
 */
const jsdomProject = {
  displayName: 'jsdom',
  rootDir,
  roots: ['<rootDir>/public'],
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: [
    `${kbnDir}/src/dev/jest/setup/babel_polyfill.js`,
    `${kbnDir}/src/dev/jest/setup/enzyme.js`,
    path.resolve(__dirname, 'setup.js'),
  ],
  modulePaths: [`${kbnDir}/node_modules`],
  moduleNameMapper: {
    '@elastic/eui$': `${kbnDir}/node_modules/@elastic/eui/test-env`,
    '@elastic/eui/lib/(.*)?': `${kbnDir}/node_modules/@elastic/eui/test-env/$1`,
    '^ui/(.*)': `${kbnDir}/src/ui/public/$1`,
    // eslint-disable-next-line max-len
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `${kbnDir}/src/dev/jest/mocks/file_mock.js`,
    '\\.(css|less|scss)$': `${kbnDir}/src/dev/jest/mocks/style_mock.js`,
    axios: 'axios/dist/node/axios.cjs',
  },
  globals: {
    'ts-jest': {
      skipBabel: true,
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx', 'html'],
  modulePathIgnorePatterns: ['__fixtures__/', 'target/'],
  testMatch: ['**/*.test.{ts,tsx}'],
  transform: {
    ...sharedTransform,
    '^.+\\.html?$': `${kbnDir}/src/dev/jest/babel_transform.js`,
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.js$'],
  snapshotSerializers: [`${kbnDir}/node_modules/enzyme-to-json/serializer`],
};

export default {
  rootDir,
  // Coverage options are root-level-only under a multi-project config; per-project options above
  // (testEnvironment, setupFiles, moduleNameMapper, testMatch, transform, ...) are what actually
  // differ between the node-logic tier and the new jsdom component tier.
  collectCoverage: true,
  collectCoverageFrom: [
    'common/**/*.ts',
    'server/**/*.ts',
    'public/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!server/wazuh-core.d.ts',
    '!**/*.test.{ts,tsx}',
  ],
  coverageDirectory: './target/test-coverage',
  coverageReporters: ['html', 'text-summary', 'json-summary'],
  projects: [nodeProject, jsdomProject],
};
