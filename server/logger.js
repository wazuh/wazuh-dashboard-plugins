const winston = require('winston');
const fs      = require('fs');
const path    = require('path');

const initDirectory = () => {
    if (!fs.existsSync('/var/log/wazuh') && process.platform === 'linux') {
        fs.mkdirSync('/var/log/wazuh');
    }
    return;
}

const wazuhlogger = winston.createLogger({
    level     : 'info',
    format    : winston.format.json(),
    transports: [
        new winston.transports.File({ 
            filename: process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, '../../wazuhapp.log') 
        })
    ]
});

wazuhlogger.exitOnError = false;

const getFilesizeInMegaBytes = filename => {
    if (fs.existsSync(filename)) {
        const stats               = fs.statSync(filename)
        const fileSizeInMegaBytes = stats.size

        return fileSizeInMegaBytes / 1000000.0;
    }
    return 0;
}

const checkFiles = () => {
    if (getFilesizeInMegaBytes(path.join(__dirname, '../../error.log')) >= 100) {
        fs.renameSync(
            process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, '../../wazuhapp.log'), 
            process.platform === 'linux' ? '/var/log/wazuh/wazuhapp.log' : path.join(__dirname, `../../wazuhapp.${new Date().getTime()}.log`)
        )
    }
};

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