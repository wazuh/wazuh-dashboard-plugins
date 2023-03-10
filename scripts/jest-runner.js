/* eslint-disable array-element-newline */
/* eslint-disable @typescript-eslint/no-var-requires */
/**

Runs Jest tests using a Docker container.

Uses development images. Must be executed from the root folder of the project.

# Usage:
# -------------
#   - node scripts/jest-runner [<jest_cli_options>]
#   - yarn test:jest:runner [<jest_cli_options>]

*/
const childProcess = require('child_process');
const fs = require('fs');

/**
 * Reads the package.json file.
 * @returns {Object} JSON object.
 */
function loadPackageJson() {
  const packageJson = fs.readFileSync('./package.json');
  return JSON.parse(packageJson);
}

/**
 * Transforms the Jest CLI options from process.argv back to a string.
 * If no options are provided, default ones are generated.
 * @returns {String} Space separated string with all Jest CLI options provided.
 */
function buildJestArgs() {
  // Remove duplicates using set
  return Array.from(new Set([ ...process.argv, '--runInBand' ]))
    .filter(opt => opt.startsWith('--'))
    .join(' ');
};

/**
 * Generates the execution parameters if they are not set.
 * @returns {Object} Default environment variables.
 */
const defaultEnvVars = () => {
  const manifest = loadPackageJson();

  return {
    APP: manifest['keywords'].includes('opensearch_dashboards') ? 'osd' : 'kbn',
    VERSION: manifest['pluginPlatform']['version'],
    REPO: process.cwd(),
    JEST_ARGS: buildJestArgs(),
  };
};

// Check the required environment variables are set
for (const [ key, value ] of Object.entries(defaultEnvVars())) {
  if (!process.argv.includes(key)) {
    process.env[key] = value;
  }
  console.log(`${key}: ${process.env[key]}`);
}

// Run test runner
const runner = childProcess.spawn(
  'docker-compose',
  [
    '--project-directory',
    './docker/test_runner',
    'up'
  ]
);

runner.stdout.on('data', data => {
  console.log(`${data}`);
});

runner.stderr.on('data', data => {
  console.error(`${data}`);
});