/* eslint-disable array-element-newline */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
Runs URL checks using a Docker container with Node.js 20.

Intended to extract URL sub paths from webDocumentationLink calls using ts-morph.

Uses Node.js 20 Alpine image to avoid conflicts with local Node.js 18.

See /docker/url-checks/docker-compose.yml for available environment variables.

# Usage:
# -------------
#   - node scripts/url-checks.js
#   - yarn url-checks
*/

const childProcess = require('child_process');

const COMPOSE_DIR = '../../docker/url-checks';

/**
 * Gets the project repository path.
 * @returns {String} Current working directory path.
 */
function getProjectInfo() {
  return {
    repo: process.cwd(),
    nodeVersion: process.env.NODE_VERSION || '20',
  };
}

/**
 * Generates the execution parameters.
 * @returns {Object} Environment variables for Docker Compose.
 */
const buildEnvVars = ({ repo, nodeVersion }) => {
  return {
    REPO: repo,
    NODE_VERSION: nodeVersion,
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
function startUrlChecks() {
  const urlChecks = childProcess.spawn('docker', [
    'compose',
    '--project-directory',
    COMPOSE_DIR,
    'up',
    '--no-log-prefix',
  ]);

  urlChecks.stdout.on('data', data => {
    console.log(`${data}`);
  });

  urlChecks.stderr.on('data', data => {
    console.error(`${data}`);
  });
}

/**
 * Main function
 */
function main() {
  const projectInfo = getProjectInfo();
  const envVars = buildEnvVars(projectInfo);

  // Check the required environment variables are set
  for (const [key, value] of Object.entries(envVars)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
    console.log(`${key}: ${process.env[key]}`);
  }

  setupAbortController();
  startUrlChecks();
}

// Only run if this is the main module
if (require.main === module) {
  main();
}
