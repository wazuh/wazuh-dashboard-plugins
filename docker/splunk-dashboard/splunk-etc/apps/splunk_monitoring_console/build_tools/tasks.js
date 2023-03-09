var path = require('path');
var fs = require('fs');
var util = require('util');
var constants = require('./constants');
function parsePassThruArgs(args) {
    var passThruArgs = [];
    if (args.watch) {
        passThruArgs.push('-w');
    }
    if (args.dev) {
        passThruArgs.push('-d');
    } else {
        // Default to production build if dev build not specified
        passThruArgs.push('-p');
    }
    if (args.liveReload) {
        passThruArgs.push('-r');
    }
    if (args.splunkVersion) {
        passThruArgs.push('--splunkVersion')
        passThruArgs.push(args.splunkVersion);
    }
    return passThruArgs;
}
function generateJsProfilesTasks(profilesDir, appName, args) {
    console.log("profile tasks", profilesDir);
    try {
        var passThruArgs = parsePassThruArgs(args);
        return fs.readdirSync(profilesDir)
            .filter(function(page) { return page.indexOf('config.js') > 0; })
            .map(function(profile) {
                var target = path.join(profilesDir, profile);
                var prefix = appName ? 'app-' + appName + ':' : '';
                var profileName = profile.replace('.config.js', '');
                var task = {
                    'name': prefix + profileName,
                    'src': path.join(profilesDir, profile),
                    'cmd': constants.nodeCmd,
                    'args': [path.join(__dirname, 'build.js'), target].concat(passThruArgs),
                    'weight': 2
                };
                if (profileName === 'splunkjs' || profileName === 'simplexml') {
                    task.deps = ['css:splunkjs'];
                }
                return task;
            });
    } catch (err) {
        if (err.code == 'ENOENT') {
            return [];
        } else {
            throw err;
        }
    }
}
module.exports = {
    generateJsProfilesTasks: generateJsProfilesTasks,
};
