const path = require('path');
process.argv.push('--config', path.resolve(__dirname, './jest.config.js'));

require('../../../../src/setup_node_env');
const jest = require('../../../../node_modules/jest');

jest.run(process.argv.slice(2));