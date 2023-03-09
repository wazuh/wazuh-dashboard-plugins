var path = require('path');

var appDir = path.join(__dirname, '../..');
var BUILD_TOOLS = path.join(appDir, 'build_tools');
var mergeConfigs = require(path.join(BUILD_TOOLS, 'util', 'mergeConfigs'));
var bootstrapCssConfig = require(path.join(BUILD_TOOLS, 'profiles', 'css_bootstrap.config'));

module.exports = bootstrapCssConfig.map(config => mergeConfigs(config, {
    output: {
        path: path.join(appDir, 'appserver', 'static', 'build', 'css')
    }
}));
