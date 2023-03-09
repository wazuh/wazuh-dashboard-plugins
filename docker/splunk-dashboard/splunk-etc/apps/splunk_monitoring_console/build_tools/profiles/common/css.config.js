var mergeConfigs = require('../../util/mergeConfigs');
var postCssConfig = require('./postcss.config');
var SplunkOmitAssetsPlugin = require('../../plugins/SplunkOmitAssetsPlugin');
var resolveLoader = require('./resolve_loader.config.js');

module.exports = function(theme, filename) {
    return mergeConfigs(
        resolveLoader,
        postCssConfig({
            extractText: true,
            extractTextFilename: filename || '[name]-' + theme + '.css',
            loadTheme: theme,
        }),
        {
            module: {
                rules: [
                    {
                        test: /\.css$/,
                        loader: 'url-loader?name=../fonts/[name].[ext]&limit=20000',
                    },
                    {
                        test: /\.(jpe?g|png|gif)$/i,
                        loader: 'url-loader?name=../images/[name].[ext]&limit=20000',
                    },
                    {
                        test: /\.svg$/,
                        loader: 'url-loader?name=../images/[name].[ext]&limit=20000',
                    },
                    {
                        test: /\.(woff|ttf)$/,
                        loader: 'url-loader?name=../fonts/[name].[ext]&limit=20000',
                    },
                ],
            },
            output: {
                filename: '[name].js',
                sourceMapFilename: '[file].map',
            },
            plugins: [
                // We don't need no javascript
                new SplunkOmitAssetsPlugin(/\.js$/),
            ],
        }
    );
};
