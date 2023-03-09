var LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = {
    plugins: [
        new LiveReloadPlugin({
            appendScriptTag: true
        })
    ]
}