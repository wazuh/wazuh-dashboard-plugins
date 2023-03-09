var path = require('path');
module.exports = {
    resolveLoader: {
        modules: [
            // Path to custom loaders
            path.resolve(__dirname, '../../web_loaders'),
            path.resolve(__dirname, '../../../node_modules'),
            // ...(process.env.SPLUNK_HOME ? [path.join(process.env.SPLUNK_HOME, 'lib/smc/node_modules')] : []),
            path.join(process.env.SPLUNK_HOME || '', 'lib', 'smc', 'node_modules'),
            'node_modules'
        ],
    },
};
