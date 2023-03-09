var fs = require('fs');
var path = require('path');

var appDir = path.join(__dirname, '..', '..');
var BUILD_TOOLS = path.join(appDir, 'build_tools');
var mergeConfigs = require(path.join(BUILD_TOOLS, 'util', 'mergeConfigs'));
var sharedConfig = require(path.join(BUILD_TOOLS, 'profiles', 'common', 'shared.config'));
var postcssConfig = require(path.join(BUILD_TOOLS, 'profiles', 'common', 'postcss.config'));

var SplunkNameModuleIdsPlugin = require(path.join(BUILD_TOOLS, 'plugins', 'SplunkNameModuleIdsPlugin'));
var DashboardExtensionOutputPlugin = require(path.join(BUILD_TOOLS, 'plugins', 'SplunkDashboardExtensionOutputPlugin'));
var appName = path.basename(appDir);
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function(options) {
    var alias = {};
    alias[appName] = path.join(appDir, 'src');
    var filter = new RegExp(options.filter);

    var entries = fs.readdirSync(path.join(appDir, 'src', 'extensions'))
    .map(function(extensionFile) {
        return extensionFile.slice(0, -3);
    })
    .reduce(function(accum, extension) {
        if (filter.test(extension)) {
            accum[extension] = appName + '/extensions/' + extension;
        }
        return accum;
    }, {});

    return mergeConfigs(sharedConfig, postcssConfig(), {
        entry: entries,
        output: {
            path: path.join(appDir, 'appserver', 'static'),
            libraryTarget: 'amd',
            filename: '[name].js',
            sourceMapFilename: '[file].map'
        },
        resolve: {
            alias: alias
        },
        plugins: [
            new SplunkNameModuleIdsPlugin({
                context: path.join(appDir, 'src'),
                prefix: appName + '-'
            }),
            new DashboardExtensionOutputPlugin(),
            new CopyWebpackPlugin([{
                from: path.join(appDir, 'src', 'static'),
                to: path.join(appDir, 'appserver', 'static'),
                ignore: ['README']
            }])
        ],
        externals: [
            function(context, request, callback) {
                if (/^splunk_monitoring_console/.test(request)) {
                    return callback();
                }
                // NOTE: This is slightly fragile if more loaders are added.
                if (/^contrib\/text\!splunk_monitoring_console/.test(request)) {
                    return callback();
                }
                return callback(null, request);
            }
        ]
    });
}

module.exports({});

