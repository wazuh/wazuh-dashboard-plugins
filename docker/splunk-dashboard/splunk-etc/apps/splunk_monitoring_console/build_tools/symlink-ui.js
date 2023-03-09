'use strict';

var fs = require('fs');
var path = require('path');

var rimraf = require('rimraf');

if (typeof process.env.SPLUNK_HOME === 'undefined') {
    console.log('SPLUNK_HOME must be set to symlink the UI for development.');
    process.exit(1);
}
var SPLUNK_HOME = process.env.SPLUNK_HOME;

if (typeof process.env.SPLUNK_SOURCE === 'undefined') {
    console.log('SPLUNK_SOURCE must be set to symlink the UI for development.');
    process.exit(1);
}
var SPLUNK_SOURCE = process.env.SPLUNK_SOURCE;

var stat = function (path) {
    return new Promise(function (resolve, reject) {
        fs.stat(path, function (error, stats) {
            if (error) {
                reject(error);
            } else {
                resolve(stats);
            }
        });
    });
};

var isDirectory = function (path) {
    return stat(path).then(function (stats) {
        if (!stats.isDirectory()) {
            throw new Error(path + ' is not a directory.');
        }
        return path;
    });
};

var rm = function (path) {
    return new Promise(function (resolve, reject) {
        rimraf(path, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

var symlink = function (target, path, type) {
    return new Promise(function (resolve, reject) {
        fs.symlink(target, path, type, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

var replaceLink = function (target, path) {
    return stat(target)
        .then(function (stats) {
            var type = stats.isDirectory() ? 'dir' : 'file';
            return rm(path)
                .then(function () {
                    console.log('Removed', path);

                    console.log('Pointed', path, '->', target);
                    return symlink(target, path, type);
                })
                .catch(function (error) {
                    console.log('Failed to remove', path, error);
                    throw error;
                });
        })
        .catch(function (error) {
            console.log(target, 'does not exist.');
        });
};

var FULL_SPLUNK_MONITORING_CONSOLE_PATH = path.resolve(SPLUNK_SOURCE, 'cfg', 'bundles', 'splunk_monitoring_console');

var BUILT_SPLUNK_MONITORING_CONSOLE_PATH = path.resolve(SPLUNK_HOME, 'etc', 'apps', 'splunk_monitoring_console');

// splunk_monitoring_console was removed from here as it no longer presented in enterprise package. You can symlink the package manually when necessary.

isDirectory(FULL_SPLUNK_MONITORING_CONSOLE_PATH)
    .then(function () {
        replaceLink(
            path.resolve(FULL_SPLUNK_MONITORING_CONSOLE_PATH, 'appserver'),
            path.resolve(BUILT_SPLUNK_MONITORING_CONSOLE_PATH, 'appserver')
        );
        replaceLink(
            path.resolve(FULL_SPLUNK_MONITORING_CONSOLE_PATH, 'default', 'data'),
            path.resolve(BUILT_SPLUNK_MONITORING_CONSOLE_PATH, 'default', 'data')
        );
        replaceLink(
            path.resolve(FULL_SPLUNK_MONITORING_CONSOLE_PATH, 'src'),
            path.resolve(BUILT_SPLUNK_MONITORING_CONSOLE_PATH, 'src')
        );
    })
    .catch(function (e) {
        console.log('Error symlinking ', FULL_SPLUNK_MONITORING_CONSOLE_PATH);
        console.log(e);
    });
