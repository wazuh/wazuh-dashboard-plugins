var fs = require('fs');
var path = require('path');

/**
 * Scan the given directory for all files that match the given
 * filter
 *
 * @param {String} dir - Directory to scan
 * @param {RegExp} filter - RegExp to match files to collect
 * @param {Boolean} recursive - Recurse into subdirectories?
 * @returns {String[]} An array of file paths
 */
module.exports = function collectFilesSync(dir, filter, recursive) {
    var files = [];
    function readdir(root) {
        fs.readdirSync(root).forEach(function(file) {
            var filePath = path.resolve(root, file);
            var stats = fs.statSync(filePath);
            if (recursive && stats.isDirectory()) {
                readdir(filePath, filter, recursive);
            } else {
                if (filter.test(filePath)) {
                    files.push(filePath);
                }
            }
        });
    }
    readdir(dir);
    return files;
}
