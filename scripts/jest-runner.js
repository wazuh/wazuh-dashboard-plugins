/* eslint-disable @typescript-eslint/no-var-requires */
/**

Runs Jest tests using into a Docker container.

Uses development images.

# Parameters
# -------------
#   - APP: osd (OpenSearch Dashboards) or kbn (Kibana)
#   - VERSION: OpenSearch Dashboards / Kibana version
#   - REPO: Path to the Wazuh app repository
# Example
# -------------
# APP="osd" VERSION="2.6.0" REPO=$(WZ_HOME) docker-compose up
# APP="kbn" VERSION="7.10.2" REPO=$(WZ_HOME) docker-compose up

*/
const childProcess = require('child_process');
const fs = require('fs');

const projectDirectory = process.cwd();
console.log(projectDirectory);

/**
 * Reads the package.json file.
 * @returns {Object} Package.json file
 */
function loadPackageJson() {
  const packageJson = fs.readFileSync('./package.json');
  return JSON.parse(packageJson);
}

/**
 * Generates the execution parameters if they are not set.
 * @returns {Object} Default environment variables
 */
const defaultEnvVars = () => {
  const manifest = loadPackageJson();

  return {
    APP: manifest['keywords'].includes('opensearch_dashboards') ? 'osd' : 'kbn',
    VERSION: manifest['pluginPlatform']['version'],
    REPO: './',
  };
};

// Check the required environment variables are set
// eslint-disable-next-line array-element-newline
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

runner.on('close', code => {
  console.log(`child process exited with code ${code}`);
});