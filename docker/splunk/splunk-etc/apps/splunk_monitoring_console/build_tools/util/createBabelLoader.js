/**
 * Creates an opinionated babel loader configuration to be used in a Webpack configuration.
 * @param  {Object} options
 * @param  {RegExp} options.test - A RegExp to match files to transform.
 * @param  {RegExp} options.include - A RegExp that determines which directory(s) the loader should be applied to.
 * @param  {String[]} options.presets - The babel presets to be used to create the laoder.
 * @return {Object} Babel loader configuration object.
 */
module.exports = function createBabelLoader(options) {
    return {
        test: options.test,
        loader: 'babel-loader',
        include: options.include,
        options: {
            cacheDirectory: process.env.NODE_ENV === 'development',
            // for apps located outside 'web' to be able to use babel, require.resolve
            // is needed: https://github.com/babel/babel-loader/issues/166
            presets: options.presets.map(require.resolve),
            plugins: [
                require.resolve('babel-plugin-add-module-exports'),
                require.resolve('babel-plugin-transform-class-properties'),
                require.resolve('babel-plugin-transform-object-rest-spread'),
                [
                    require.resolve('babel-plugin-transform-runtime'),
                    {
                        helpers: true, // uses babel-runtime/helpers instead of inline helpers
                        polyfill: false,
                        regenerator: true, // enable generator support
                    },
                ],
            ],
        },
    };
};
