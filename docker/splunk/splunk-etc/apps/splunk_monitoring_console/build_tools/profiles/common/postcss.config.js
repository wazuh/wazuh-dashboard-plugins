var path = require('path');
var _ = require('lodash');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

var DEFAULT_OPTIONS = {
    variables: {},
    path: [],
    extractText: false,
    extractTextFilename: '[name].css',
    splunkVersion: 'dev',
    profileName: '',
    loadTheme: 'enterprise',
};

/**
 * A function that returns a webpack configuration object to use post css. The
 * config only contains parameters necessary to make postcss work, and is
 * intended to be merged with a base configuration object.
 *
 * @param {Object} [options]
 * @param {Object} [options.variables] - A map of variable names and values that
 * will be passed to the postcss-simple-vars plugin.
 * @param {String|String[]} [options.path = 'search_mrsparkle/exposed'] - Passed
 * to postcss-import plugin to resolve import statements.
 * @param {Boolean} [options.modules = true] - Use css modules.
 * @param {Boolean} [options.extractText = false] - Use the ExtractTextPlugin to
 * output a css file.
 * @param {String} [options.extractTextFilename = '[name].css'] - A name file
 * name to use with the extract text plugin.
 * @param {String} [options.loadTheme = 'enterprise'] - Determines the brand
 * color. Must be 'enterprise' or 'lite'.
 * @returns {Object} webpack configuration object
 */
module.exports = function(options) {
    options = _.merge({}, DEFAULT_OPTIONS, options);

    var isDev = process.env.NODE_ENV === 'development';
    var plugins = [];
    var rules = [];

    var styleLoader = 'style-loader';
    var styleLoaderOptions = { sourceMap: isDev };

    var cssLoader = 'css-loader';
    var cssLoaderOptions = { sourceMap: isDev };
    var cssLoaderModulesOptions = {
        modules: true,
        importLoaders: 1,
        sourceMap: isDev,
        localIdentName:
            '[local]---' + options.profileName + '---' + options.splunkVersion.replace('.', '-') + '---[hash:base64:5]',
    };

    var postcssLoader = 'postcss-loader';
    var postcssOptions = {
        ident: 'postcss',
        sourceMap: isDev,
        plugins: () => [
            require('../../postcss_plugins/splunk-postcss-theme-import')({ theme: options.loadTheme }),
            require('postcss-import')({
                path: options.path,
            }),
            require('postcss-mixins'),
            require('postcss-for'),
            require('postcss-simple-vars')({
                variables: _.merge({ theme: options.loadTheme }, options.variables),
            }),
            require('postcss-conditionals'),
            require('postcss-calc'),
            require('postcss-color-function'),
            require('postcss-initial')({ replace: true }),
            require('autoprefixer')({ browsers: ['last 2 versions'] }),
            require('postcss-nested'),
        ],
    };

    if (options.extractText) {
        plugins.push(
            new MiniCssExtractPlugin({
                filename: options.extractTextFilename,
            })
        );
        rules.push({
            test: /\.pcss$/,
            use: [
                { loader: MiniCssExtractPlugin.loader },
                { loader: cssLoader, options: cssLoaderOptions },
                { loader: postcssLoader, options: postcssOptions },
            ],
        });
        rules.push({
            test: /\.pcssm$/,
            use: [
                { loader: MiniCssExtractPlugin.loader },
                { loader: cssLoader, options: cssLoaderModulesOptions },
                { loader: postcssLoader, options: postcssOptions },
            ],
        });
    } else {
        rules.push({
            test: /\.pcss$/,
            use: [
                { loader: styleLoader, options: styleLoaderOptions },
                { loader: cssLoader, options: cssLoaderOptions },
                { loader: postcssLoader, options: postcssOptions },
            ],
        });
        rules.push({
            test: /\.pcssm$/,
            use: [
                { loader: styleLoader, options: styleLoaderOptions },
                { loader: cssLoader, options: cssLoaderModulesOptions },
                { loader: postcssLoader, options: postcssOptions },
            ],
        });
    }

    return {
        plugins: plugins,
        module: {
            rules: rules,
        },
    };
};
