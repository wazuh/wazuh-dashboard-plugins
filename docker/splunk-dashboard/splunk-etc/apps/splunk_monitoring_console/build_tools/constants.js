var path = require('path');

var nodeCmd = path.join(process.env.SPLUNK_HOME, 'bin', 'node');
var appBuildRelDir = path.join('cfg', 'bundles');
var appBuildDir = path.join(process.env.SPLUNK_SOURCE, appBuildRelDir);
var appDestRelDir = path.join('etc', 'apps');
var appDestDir = path.join(process.env.SPLUNK_HOME, appDestRelDir);
module.exports = {
    nodeCmd: nodeCmd,
    appBuildRelDir: appBuildRelDir,
    appBuildDir: appBuildDir,
    appDestRelDir: appDestRelDir,
    appDestDir: appDestDir,
    $dst: '$DST',
    $src: '$SRC'
};
