const winston = require('winston');
const fs      = require('fs');
const path    = require('path');

const wazuhlogger = winston.createLogger({
    level     : 'info',
    format    : winston.format.json(),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, '../../error.log'), 
            level   : 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, '../../combined.log') 
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
            path.join(__dirname, '../../error.log'), 
            path.join(__dirname, `../../error.${new Date().getTime()}.log`)
        )
    }
    if (getFilesizeInMegaBytes(path.join(__dirname, '../../combined.log')) >= 100) {
        fs.renameSync(
            path.join(__dirname, '../../combined.log'), 
            path.join(__dirname, `../../combined.${new Date().getTime()}.log`)
        )
    }
};

const log = (location, message, level) => {
    checkFiles();
    wazuhlogger.log({
        date    : new Date(),
        level   : level || 'error',
        location: location || 'unknown',
        message : message || 'An error occurred'
    });
};

module.exports = { log }