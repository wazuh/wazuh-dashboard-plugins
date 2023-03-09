var sourceMap = require('source-map');
var path = require('path');

var coreJSPath = path.dirname(require.resolve('core-js'));
var coreJSPathES6 = path.join(coreJSPath, 'es6');
var coreJSRequire = 'require(' + JSON.stringify(coreJSPathES6) + ');\n';
var useStrictRegExp = /^['"]use strict['"];?/;

/**
 * A webpack loader that prepends a require statement importing
 * the core-js ES6 polyfill. Handles 'use strict' statements if
 * they appear at the very beginning of the resource. Modifies
 * source maps accordingly.
 *
 * @param content - module content
 * @returns - polyfilled or unmodified module content
 */
module.exports = function (content, map) {
    this.cacheable();

    var prefix = coreJSRequire;
    var newContent = content;

    var withStrict = useStrictRegExp.exec(content);
    if (withStrict) {
        prefix = '\'use strict\';\n' + coreJSRequire;
        newContent = content.slice(withStrict[0].length);
    }

    if (map) {
        var node = sourceMap.SourceNode.fromStringWithSourceMap(content, new sourceMap.SourceMapConsumer(map));

        if (withStrict) {
            node.children[0] = node.children[0].substring('\'use strict\';'.length);
        }
        node.prepend(prefix);

        var result = node.toStringWithSourceMap();
        return this.callback(null, result.code, result.map.toJSON());
    }

    return prefix + newContent;
};
