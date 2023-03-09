var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var ProgressPlugin = require('webpack/lib/ProgressPlugin');

/**
 * Production configuration settings
 * @type {Object}
 */
module.exports = {
    mode: 'production',
    plugins: process.stdout.isTTY
        ? [
              // Prints progress of the build to the console
              new ProgressPlugin(function(progress, msg) {
                  process.stdout.write('\r                                                      ');
                  if (progress !== 1) {
                      process.stdout.write('\rProgress: ' + Math.round(progress * 100) + '% ' + msg);
                  }
              }),
          ]
        : [],
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true, // this setting speeds up builds _significantly_
                terserOptions: {
                    compress: { drop_debugger: false },
                    mangle: false,
                },
            }),
            new OptimizeCSSAssetsPlugin(),
        ],
    },
};
