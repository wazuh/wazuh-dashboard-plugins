//  MC CI UI runner script
//
//  This is called by ci_ui_integration_mc.sh - see file for input/environment

//
//  EDIT WITH CAUTION!
//    This script impacts all of our CI runs. If you break it, expect angry yelling.
//
//  WHAT THIS DOES:
//    Executes Karma runs
//    Runs all the linters
//
//  OUTPUT:
//    If one ore more subtasks fail, the exit code will be > 0.


// Configuration

var karmaRuns = [
    { name: 'splunk_monitoring_console', args: ['--apps', 'splunk_monitoring_console'] }
];

var lintingRuns = [
    { name: 'npmLinters', cmd: 'npm', args: ['run', 'ci:lint'] }
];
// Execution

console.log('Running UI Lint and Unit tests for Monitoring Console\n');

var path = require('path');
const {exec} = require('child_process');

var testDir = __dirname;
var karmaPath = path.join('node_modules', 'karma', 'bin', 'karma');
var karmaBaseArgs = [karmaPath, 'start', 'karma.conf.js', '--single-run', '--browsers', 'ChromeHeadlessCI',
    '--reporters', 'dots,junit', '--no-colors'];
var xmlOutputDir = 'ci_ui_xml_mc';

console.log("env.FE_COVERAGE", process.env.FE_COVERAGE);
var generateCodeCoverage = process.env.FE_COVERAGE === 'true';

function execCommand(cmd, dir, callback) {
    console.log("Running command: ", cmd);
    exec(
        cmd,
        {
            cwd: dir
        },
        (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                console.error(`exec stdout: ${stdout}`);
                console.error(`exec stderr: ${stderr}`);
                return;
            }
            callback(stdout);
        }
    );
}

function run_lint_unit_tests() {

    if (generateCodeCoverage) {
        var karmaRunIndex;
        for (karmaRunIndex in karmaRuns) {
            karmaRuns[karmaRunIndex].args.push("--coverage");
        }
        console.log("Enabled coverage", karmaRuns);
    }
    else {
        console.log("Running without coverage", karmaRuns);
    }


    var karmaCmds = karmaRuns.map(function (run) {
        return karmaBaseArgs.concat(
            '--junit-directory', xmlOutputDir,
            '--junit-filename', 'test_' + run.name + '.xml',
            run.args).join(' ');
    }).join('\n');

    var lintingCmds = lintingRuns.map(function (run) {
        return [run.cmd].concat(run.args).join(' ');
    }).join('\n');

    console.log("Running commands from dir:", testDir);
    // https://geedew.com/What-does-unsafe-perm-in-npm-actually-do/
    execCommand('npm install --unsafe-perm=true', testDir, function (stdout) {
        console.log("Finished installing dependencies");
        console.log("##### STDOUT #####");
        console.log(stdout);
        execCommand(lintingCmds, testDir, function (stdout) {
            console.log("Finished Linting tests");
            console.log("##### STDOUT #####");
            console.log(stdout);
        });
        execCommand(karmaCmds, testDir, function (stdout) {
            console.log("Finished Unit tests");
            console.log("##### STDOUT #####");
            console.log(stdout);
        });
    });
}

run_lint_unit_tests();

