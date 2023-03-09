// UI linting script
//
// Uses eslint to lint:
//   - our ES6+ codebase (.es/.jsx, airbnb rule set)
//
// Uses jshint to lint:
//   - our ES5 codebase (.js, relaxed rule set)
//
// npm scripts you can use (npm run <task>):
//   - lint (runs all targets on console)
//   - lint:es+jsx (runs es6+ targets on console)
//   - lint:es+jsx:fix (runs es6+ targets on console, auto-fix mode enabled)
//   - lint:js (runs es5 targets on console)
//   - ci:lint (runs all targets, exports to XML)
//
// Targets can be filtered by name, for example:
//   - npm run lint -- preBubbles splunk_monitoring_console


var _ = require('lodash');
var cheerio = require('cheerio');
var colors = require('colors/safe');
var cproc = require('child_process');
var fs = require('fs-extra');
var glob = require('glob');
var path = require('path');

var config = {
    js: {
        splunk_monitoring_console: {
            patterns: ['src'],
            options: ['-c', path.join('.', '.jshintrc'), '--exclude-path', path.join('.', '.jshintignore')],
            reportRoot: '.'
        },
    },
    es: {
        splunk_monitoring_console_jsx: {
            patterns: ['src'],
            options: ['--ext', '.es,.jsx'],
            reportRoot: '.'
        },
    }
};

var args = process.argv.slice(2);
var xmlMode = _.includes(args, '--xml');
var fixMode = _.includes(args, '--fix');
var jsCmd = path.join('node_modules', 'jshint', 'bin', 'jshint');
var esCmd = path.join('node_modules', 'eslint', 'bin', 'eslint.js');
var xmlOutputDir = 'ci_ui_xml_mc';
fs.mkdirsSync(xmlOutputDir);

if (xmlMode) {
    console.log(colors.italic('Activating xml output mode'));

    _.each(config.js, function (config) {
        config.options.push('--reporter', path.join('node_modules', 'jshint-junit-reporter', 'reporter.js'));
    });
    _.each(config.es, function (config, target) {
        config.options.push('-f', 'junit', '-o', path.join(xmlOutputDir, 'lint_' + target + '.xml'));
    });
    args = _.without(args, '--xml');
}

if (fixMode) {
    console.log(colors.italic('Activating auto-fix mode for ES6+ targets'));

    _.each(config.es, function (config) {
        config.options.push('--fix');
    });
    args = _.without(args, '--fix');
}

if (!_.isEmpty(args)) {
    config.js = _.pick(config.js, args);
    config.es = _.pick(config.es, args);
}

_.each(config, function (targetGroup, mode) {
    _.each(targetGroup, function (targetConfig, target) {

        console.log(colors.underline('\nRunning target: ' + target + '\n'));

        var targetPatterns = _(targetConfig.patterns)
            .map(function (pattern) {
                return glob.sync(pattern);
            })
            .flatten().value();

        var outFile = path.join(xmlOutputDir, 'lint_' + target + '.xml');

        //the open file descriptors are never closed - shhh
        var stdio = mode == 'js' && xmlMode ? ['ignore', fs.openSync(outFile, 'w'), process.stderr] : 'inherit';

        //TODO: in XML mode this should use spawn (use multiple cores)
        var cp = cproc.spawnSync(mode == 'js' ? jsCmd : esCmd, targetConfig.options.concat(targetPatterns), { stdio: stdio });
        var failure = mode == 'js' && cp.status == 1; //see exit code description below
        process.exitCode = (process.exitCode > 0 || failure) ? 1 : 0;

        if (!failure && xmlMode && mode == 'js') {
            enhanceForJenkins(outFile, targetConfig.reportRoot, target);
        }
    });
});


function enhanceForJenkins(file, root, target) {
    var xml = cheerio.load(fs.readFileSync(file), { xmlMode: true })('testsuite');

    xml.find('testcase').each(function () {
        var item = cheerio(this);
        var classname = item.attr('name');

        if (classname == 'jshint') {
            item.remove(); //jshint bug (remove empty test case)
        }

        if (_.startsWith(classname, root)) {
            classname = classname
                .replace(root + '/', '')
                .replace(root, '')
        }

        item.attr('classname', 'jshint' + '_' + target + '.' + classname.replace(/\./g, '_'));
        item.attr('name', classname);
    });

    fs.writeFileSync(file, xml.toString());
}

//exit codes:
//jshint: 0 - ok, 1 - general error, 2 - lint errors
//eslint: 0 - ok, 1 - general or linting error
