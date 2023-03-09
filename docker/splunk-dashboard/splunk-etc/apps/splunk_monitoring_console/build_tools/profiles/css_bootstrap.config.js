var path = require('path');
var mergeConfigs = require('../util/mergeConfigs');
var cssConfig = require('./common/css.config');

var appDir = path.join(__dirname, '../..');
var outputPath = path.join(appDir, 'appserver', 'static', 'build', 'css');
var entryPath = path.join(appDir, 'src', 'pcss' ,'base', 'bootstrap.pcss');
module.exports = ['enterprise', 'lite', 'dark'].map(theme => mergeConfigs(cssConfig(theme, `bootstrap-${theme}.css`), {
    output: { path: outputPath },
    entry: { bootstrap: entryPath },
}));
