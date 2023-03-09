var path = require('path');

var appDir = path.join(__dirname, '../..');
var BUILD_TOOLS = path.join(appDir, 'build_tools');
var mergeConfigs = require(path.join(BUILD_TOOLS, 'util', 'mergeConfigs'));
var sharedConfig = require(path.join(BUILD_TOOLS, 'profiles', 'common', 'shared.config'));

var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = mergeConfigs(sharedConfig, {
    plugins: [
        new CopyWebpackPlugin([{
            from: path.join(appDir, 'src', 'visualizations', 'heatmap'),
            to: path.join(appDir, 'appserver', 'static', 'visualizations', 'heatmap'),
            ignore: ['README', 'src/**', 'node_modules/**']
        }])
    ],
    entry: 'heatmap',
    resolve: {
        alias: {
            'underscore': 'underscore'
        },
        modules: [
            path.join(appDir, 'src', 'visualizations', 'heatmap', 'node_modules'),
            path.join(appDir, 'src', 'visualizations', 'heatmap', 'src')
        ]
    },
    output: {
        path: path.join(appDir, 'appserver', 'static', 'visualizations', 'heatmap'),
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    externals: [
        'vizapi/SplunkVisualizationBase',
        'vizapi/SplunkVisualizationUtils'
    ]
});
