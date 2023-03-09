var postcss = require('postcss');
var path = require('path');
var constants = require('../../constants');
var appDir = path.join(__dirname, '..', '..', '..');

module.exports = postcss.plugin('splunk-theme-import', function (options) {
    return function (css) {
        var basedir = path.join(appDir, 'src/pcss/base');
        var relativedir = path.relative(path.dirname(css.source.input.file), basedir) || '.';
        css.prepend({ name: 'import', params: '"' + relativedir + '/mixins.pcss"', source: css.source });
        css.prepend({ name: 'import', params: '"' + relativedir + '/variables.' + options.theme + '.pcss"', source: css.source });
        css.prepend({ name: 'import', params: '"' + relativedir + '/brand.' + options.theme + '.pcss"', source: css.source });
    };
});
