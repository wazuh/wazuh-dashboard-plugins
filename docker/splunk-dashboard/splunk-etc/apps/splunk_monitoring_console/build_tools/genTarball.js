const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const pkgJson = require('../package.json');

const log = {
    info: (msg) => console.log(msg),
};

function copyFolderSync(src, dest) {
    try {
        log.info(`Copying src dir: ${src} to dest: ${dest}`);
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.readdirSync(src).forEach((element) => {
            if (fs.lstatSync(path.join(src, element)).isFile()) {
                fs.copyFileSync(path.join(src, element), path.join(dest, element));
            } else {
                copyFolderSync(path.join(src, element), path.join(dest, element));
            }
        });
    } catch (err) {
        log.info(`Unable to copy folder. Error: ${err}`);
    }
}

function execCmdSync(cmd, opts = {}) {
    log.info(`Executing command: ${cmd}`);
    return execSync(cmd, opts);
}

if (!process.env.SPLUNK_HOME) {
    log.info('$SPLUNK_HOME is not set!');
    return;
}

if (!process.env.SPLUNK_SOURCE) {
    log.info('$SPLUNK_SOURCE is not set!');
    return;
}

log.info(`$SPLUNK_HOME is ${process.env.SPLUNK_HOME}`);
log.info(`$SPLUNK_SOURCE is ${process.env.SPLUNK_SOURCE}`);

const ROOT = path.join(process.env.SPLUNK_SOURCE, 'cfg', 'bundles', 'splunk_monitoring_console');
const VERSION = pkgJson.version;
const nodeModulesPath = path.join(ROOT, 'node_modules');
const tarball = `smcwp-${VERSION}.tar.gz`;
const tarballPath = path.join(ROOT, tarball);
const splunkHome = process.env.SPLUNK_HOME;
const splunkBin = path.join(splunkHome, 'bin', 'splunk');

// If node_modules dir exists, remove it
if (fs.existsSync(nodeModulesPath)) {
    log.info(`${nodeModulesPath} exists ... deleting`);
    fs.rmdirSync(nodeModulesPath, { recursive: true });
}

// If tarball exists, remove it
if (fs.existsSync(tarballPath)) {
    log.info(`${tarball} exists ... deleting`);
    fs.unlinkSync(tarballPath);
}

// Install all dependencies
execCmdSync(`${splunkBin} cmd npm install -production`, { cwd: ROOT });

// Make the tarball
const tarCmd = `tar -cvzf ${tarball} node_modules`;
execSync(tarCmd, { cwd: ROOT, stdio: 'ignore' });

log.info(`Tarball of SMC is found at path: ${tarballPath}`);
log.info(`Tarball size: ${fs.statSync(tarballPath).size / 1000000} MB.`);

log.info('To upload the generated tarball:');
log.info('    Move the tarball to contrib directory');
log.info('    From contrib run the command: `splunk cmd python upload_archive.py <tarball>`');
log.info('    Then update contrib/smc_modules_version.py with the new version and SHA');
