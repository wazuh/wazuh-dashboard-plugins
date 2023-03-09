var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var TEMPLATE_FILE = path.resolve(__dirname, '..', 'util', 'getPathTemplate.js');
var getPathTemplate = _.template(fs.readFileSync(TEMPLATE_FILE, 'utf8'));

/**
 * A webpack loader that injects a script to set __webpack_public_path__ to the appropriate url.
 * Specify the base path as a query parameter.
 * This should only be used on an entry file.
 * @example
 * 
 *     'splunk-public-path-injection-loader?static/build/woot!path/to/entry.js'
 *     
 * @param  {String} content The file content. This is passed by webpack.
 * @return {String}         The new file content with the script injected.
 */
module.exports = function publicPathInjectionLoader(content) {
    var path = this.query.substring(1);
    
    var script = getPathTemplate({
        path: path
    });
    return script + content;
};

