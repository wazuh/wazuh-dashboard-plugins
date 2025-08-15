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

const COMPOSE_DIR = './docker/url-checks';

/**
 * Gets the project repository path.
 * @returns {{
 *   repo: string,
 *   nodeVersion: string
 * }} Current working directory path.
 */
function getProjectInfo() {
  return {
    repo: process.cwd(),
    nodeVersion: process.env.NODE_VERSION || '20',
  };
}

/**
 * Generates the execution parameters.
 * @returns {{
 *   REPO: string,
 *   NODE_VERSION: string
 * }} Environment variables for Docker Compose.
 */
const buildEnvVars = ({ repo, nodeVersion }) => {
  return {
    REPO: repo,
    NODE_VERSION: nodeVersion,
  };
};

/**
 * Captures the SIGINT signal (Ctrl + C) to stop and remove the container and exit.
 */
function setupAbortController() {
  process.on('SIGINT', () => {
    console.log(
      'SIGINT received. Stopping and removing containers and images...',
    );
    childProcess.spawnSync(
      'docker',
      ['compose', '--project-directory', COMPOSE_DIR, 'down', '--rmi', 'all'],
      { stdio: 'inherit' },
    );
    process.exit();
  });
}

/**
 * Start the container and remove it once the 'up' process finishes.
 */
function startUrlChecks() {
  // Clean any previous containers/images for this compose project before starting
  childProcess.spawnSync(
    'docker',
    ['compose', '--project-directory', COMPOSE_DIR, 'down', '--rmi', 'all'],
    { stdio: 'inherit' },
  );

  const urlChecks = childProcess.spawn('docker', [
    'compose',
    '--project-directory',
    COMPOSE_DIR,
    'up',
    '--no-log-prefix',
    '--abort-on-container-exit',
  ]);

  urlChecks.stdout.on('data', data => {
    console.log(`${data}`);
  });

  urlChecks.stderr.on('data', data => {
    console.error(`${data}`);
  });

  urlChecks.on('error', err => {
    console.error('Failed to start docker compose:', err);
    process.exit(1);
  });

  urlChecks.on('close', code => {
    console.log(
      `docker compose up exited with code ${code}. Removing containers and images...`,
    );
    childProcess.spawnSync(
      'docker',
      ['compose', '--project-directory', COMPOSE_DIR, 'down', '--rmi', 'all'],
      { stdio: 'inherit' },
    );
    process.exit(code);
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
    console.log(`${key}:`, value);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  setupAbortController();
  startUrlChecks();
}

// Only run if this is the main module
if (require.main === module) {
  main();
}
