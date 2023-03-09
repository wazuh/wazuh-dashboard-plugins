const _ = require('lodash');
const path = require('path');

const log = require('karma/lib/logger').create('config');

module.exports = {
    config: (config) => {
        // splunk-specific i18n setup and helpers
        log.debug('Setting up i18n for testing');

        const files = _.get(config, 'files', []);
        files.unshift(
            path.join(__dirname, 'src', 'util', 'i18n.js'),
            path.join(__dirname, 'i18n.js')
        );
        _.set(config, 'files', files);

        log.debug('Setting NODE_PATH for testing if not set');

        if (!_.has(process.env, 'NODE_PATH')) {
            process.env.NODE_PATH = path.join(__dirname, 'node_modules');
        }
    },
};
