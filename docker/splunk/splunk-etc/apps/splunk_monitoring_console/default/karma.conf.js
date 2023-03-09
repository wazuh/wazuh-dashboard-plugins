var path = require('path');
var testRunner = require('@splunk/coreui-karma-unit-test-runner');
var env = require('./environment.es');
var flakyTests = require('./flaky-tests');

var basePath = path.join(__dirname);

var settings = {
    basePath: basePath,
    testApps: {
        splunk_monitoring_console: {
            path: '.',
            coveragePatterns: path.join('appserver', 'test', 'support', 'coverage-patterns.json')
        }
    },
    testDir: path.join('appserver', 'test'),
    testRegexp: 'appserver\\/test\\/(.*\\btest_.+)(?:\\.js|\\.es|\\.jsx)$',
    testStyle: 'tdd',
    features: {
        chai: true,
        coverage: {
            direct: true,
            babel: true,
        },
        pcssmStub: true,
        sinon: true,
        timezone: 'US/Pacific',
    },
    files: [
        // src files
        // "src/**/*.js",
      ],
    externalSourcePaths: {
        // 'splunk_monitoring_console': path.join(basePath, 'src'),
        // 'backbone': path.join(basePath, 'src', 'contrib'),
    },
    outputDir: path.join('.'),
    bootstrapConfig: path.join(__dirname, 'bootstrap-config'),
    exclusions: flakyTests
};

module.exports = function(config) {
    config.set({
        browsers: ['ChromeHeadlessCI'],
        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--remote-debugging-port=9222'
                ]
            }
        }
    });
    testRunner.config(config, settings);
    if (config.coverage) {
        config.coverageReporter.reporters = config.coverageReporter.reporters.concat({ type: 'lcov' }, {type: 'cobertura'});
    }
    env.config(config);
};

module.exports.settings = settings;
