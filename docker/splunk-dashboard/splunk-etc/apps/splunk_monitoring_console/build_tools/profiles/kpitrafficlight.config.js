var path = require('path');
var appDir = path.join(__dirname, '../..');
var BUILD_TOOLS = path.join(appDir, 'build_tools');
var mergeConfigs = require(path.join(BUILD_TOOLS, 'util', 'mergeConfigs'));
var sharedConfig = require(path.join(BUILD_TOOLS, 'profiles', 'common', 'shared.config'));
var CopyWebpackPlugin = require('copy-webpack-plugin');
module.exports = mergeConfigs(sharedConfig, {
    plugins: [
        new CopyWebpackPlugin([{
            from: path.join(appDir, 'src', 'visualizations', 'KpiTrafficLight'),
            to: path.join(appDir, 'appserver', 'static', 'visualizations', 'KpiTrafficLight'),
            ignore: ['README']
        }]),
    ],
    entry: {
        visualization: path.join(appDir, 'src', 'visualizations', 'KpiTrafficLight', 'visualization.js'),
    },
    resolve: {
        alias: {
            'splunk_monitoring_console': path.join(appDir, 'src'),
        },
    },
    output: {
        path: path.join(appDir, 'appserver', 'static', 'visualizations', 'KpiTrafficLight'),
        filename: '[name].js',
        libraryTarget: 'amd'
    },
    externals: [
        'vizapi/SplunkVisualizationBase',
        'vizapi/SplunkVisualizationUtils'
    ]
});