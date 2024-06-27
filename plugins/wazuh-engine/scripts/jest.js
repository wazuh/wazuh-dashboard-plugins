// # Run Jest tests
//
// All args will be forwarded directly to Jest, e.g. to watch tests run:
//
//     node scripts/jest --watch
//
// or to build code coverage:
//
//     node scripts/jest --coverage
//
// See all cli options in https://facebook.github.io/jest/docs/cli.html

const path = require('path');
process.argv.push('--config', path.resolve(__dirname, '../test/jest/config.js'));

require('../../../src/setup_node_env');
const jest = require('../../../node_modules/jest');

jest.run(process.argv.slice(2));
