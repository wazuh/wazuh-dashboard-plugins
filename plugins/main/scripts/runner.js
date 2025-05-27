/* eslint-disable array-element-newline */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
Runs yarn commands using a Docker container.

Intended to test and build locally.

Uses development images. Must be executed from the root folder of the project.

See /docker/runner/docker-compose.yml for available environment variables.

# Usage:
# -------------
#   - node scripts/runner <command> [<command_args>]
#   - yarn test:jest:runner [<jest_args>]
#   - yarn build:runner
*/

const childProcess = require('child_process');
const { loadPackageJson } = require('./manifest');

const COMPOSE_DIR = '../../docker/runner';

function getProjectInfo() {
  const manifest = loadPackageJson();

  return {
    app: manifest['keywords'].includes('opensearch_dashboards') ? 'osd' : 'kbn',
    version: manifest['pluginPlatform']['version'],
    repo: process.cwd(),
  };
}

function getBuildArgs({ app, version }) {
  return app === 'osd'
    ? `--opensearch-dashboards-version=${version}`
    : `--kibana-version=${version}`;
}

/**
 * Transforms the Jest CLI options from process.argv back to a string.
 * If no options are provided, default ones are generated.
 * @returns {String} Space separated string with all Jest CLI options provided.
 */
function getJestArgs() {
  // Take args only after `test` word
  const index = process.argv.indexOf('test');
  const args = process.argv.slice(index + 1);
  // Remove duplicates using set
  return Array.from(
    new Set([...args, '--runInBand', '--collectCoverage=false']),
  ).join(' ');
}

/**
 * Generates the execution parameters if they are not set.
 * @returns {Object} Default environment variables.
 */
const buildEnvVars = ({ app, version, repo, cmd, args }) => {
  return {
    APP: app,
    VERSION: version,
    REPO: repo,
    CMD: cmd,
    ARGS: args,
  };
};

/**
 * Captures the SIGINT signal (Ctrl + C) to stop the container and exit.
 */
function setupAbortController() {
  process.on('SIGINT', () => {
    childProcess.spawnSync('docker', [
      'compose',
      '--project-directory',
      COMPOSE_DIR,
      'stop',
    ]);
    process.exit();
  });
}

/**
 * Start the container.
 */
function startRunner() {
  const runner = childProcess.spawn('docker', [
    'compose',
    '--project-directory',
    COMPOSE_DIR,
    'up',
    '--no-log-prefix',
  ]);

  runner.stdout.on('data', data => {
    console.log(`${data}`);
  });

  runner.stderr.on('data', data => {
    console.error(`${data}`);
  });
}

/**
 * Main function
 */
function main() {
  if (process.argv.length < 2) {
    process.stderr.write('Required parameters not provided');
    process.exit(-1);
  }

  const projectInfo = getProjectInfo();
  let envVars = {};

  switch (process.argv[2]) {
    case 'build':
      envVars = buildEnvVars({
        ...projectInfo,
        cmd: 'plugin-helpers build',
        args: getBuildArgs({ ...projectInfo }),
      });
      break;

    case 'test':
      envVars = buildEnvVars({
        ...projectInfo,
        cmd: 'test:jest',
        args: getJestArgs(),
      });
      break;

    default:
      // usage();
      console.error('Unsupported or invalid yarn command.');
      process.exit(-1);
  }

  // Check the required environment variables are set
  for (const [key, value] of Object.entries(envVars)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
    console.log(`${key}: ${process.env[key]}`);
  }

  setupAbortController();
  startRunner();
}

main();
