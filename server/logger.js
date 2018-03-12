const winston = require('winston');
const fs      = require('fs');
const path    = require('path');

/** 
 * Checks if /var/log/wazuh exists on linux systems. If it doesn't exist, it will be created.
 */
const initDirectory = () => {
    if (!fs.existsSync('/var/log/wazuh') && process.platform === 'linux') {
        fs.mkdirSync('/var/log/wazuh');
    }
    return;
}

/** 
 * Here we create the logger
 */
const wazuhlogger = winston.createLogger({
    level     : 'info',
    format    : winston.format.json(),
    transports: [
        new winston.transports.File({ 
            filename: process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, '../../wazuhapp.log') 
        })
    ]
});

/**
 * Prevents from exit on error related to the logger.
 */
wazuhlogger.exitOnError = false;

/**
 * Returns given file size in MB, if the file doesn't exist returns 0
 * @param {*} filename Path to the file
 */
const getFilesizeInMegaBytes = filename => {
    if (fs.existsSync(filename)) {
        const stats               = fs.statSync(filename)
        const fileSizeInMegaBytes = stats.size

        return fileSizeInMegaBytes / 1000000.0;
    }
    return 0;
}

/** 
 * Checks if the wazuhapp.log file size is greater than 100MB, if so it rotates the file.
 */
const checkFiles = () => {
    if (getFilesizeInMegaBytes(process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, '../../wazuhapp.log')) >= 100) {
        fs.renameSync(
            process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, '../../wazuhapp.log'), 
            process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, `../../wazuhapp.${new Date().getTime()}.log`)
        )
    }
};

/**
 * Main function to add a new log
 * @param {*} location File where the log is being thrown
 * @param {*} message Message to show
 * @param {*} level Optional, default is 'error'
 */
const log = (location, message, level) => {
    initDirectory();
    checkFiles();
    wazuhlogger.log({
        date    : new Date(),
        level   : level || 'error',
        location: location || 'unknown',
        message : message || 'An error occurred'
    });
};

module.exports = { log }