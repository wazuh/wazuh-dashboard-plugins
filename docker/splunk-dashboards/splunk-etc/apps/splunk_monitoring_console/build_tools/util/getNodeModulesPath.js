var fs = require('fs');
var path = require('path');

/**
 * Looks for the targetPackage in a node_modules directory. Uses similar resolution logic as Node's
 * require.resolve.
 *
 * This is useful when their is a resolution conflict between a package in node_modules and file in
 * the projects resolve.root directory.
 *
 * @param {String} targetPackage - The name of the package to find the path for.
 * @param {String} startingDir - The starting directory.
 * @param {String} fallbackDir - A fallback directory, similar to `NODE_PATH`.
 * @returns {String|null} The absolute path the the targetPackage or null if it couldn't be found.
 */
module.exports = function getNodeModulesPath(targetPackage, startingDir, fallbackDir) {
    var packagePath = path.join(startingDir, 'node_modules', targetPackage);
    if (fs.existsSync(packagePath)) {
        return packagePath;
    } else {
        var nextDir = path.dirname(startingDir);
        if (nextDir === path.dirname(nextDir)) {
            var fallbackPackagePath = path.join(fallbackDir, targetPackage);
            if (fs.existsSync(fallbackPackagePath)) {
                return fallbackPackagePath;
            } else {
                return null;
            }
        }
        return getNodeModulesPath(targetPackage, nextDir, fallbackDir)
    }
}
