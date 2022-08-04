module.exports = function (message = '', level = 'INFO') {
    const timestamp = new Date().toISOString().split('T').join(' ').split('.')[0];
    switch (level.toUpperCase()) {
        case 'ERROR':
            console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
            break;
        default:
            console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
}