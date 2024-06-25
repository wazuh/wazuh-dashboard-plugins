
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');

/**
 * Reads the package.json file.
 * @returns {Object} JSON object.
 */
function loadPackageJson() {
  const packageJson = fs.readFileSync('./package.json');
  return JSON.parse(packageJson);
}

module.exports = {
  loadPackageJson
};