const ElasticWrapper = require('./lib/elastic-wrapper');
const cron           = require('node-cron');
const { log }        = require('./logger');

module.exports = server => {
    let abort = 0;
    const wzWrapper = new ElasticWrapper(server);

    const clean = async () => {
        try {
            if(abort < 3) {
                const date = new Date();
                date.setTime(date.getTime() - (60 * 60 * 1000))
                await wzWrapper.deleteVisualizationByDescription(date.getTime(),true);
                log('vis-deletion-cron.js',`Deleted visualizations with a timestamp lower than ${date.getTime()}`,'info');
                return;
            } 
        } catch (error) {
            abort++;
            log('vis-deletion-cron.js', error.message || error);
        }
    }

 
    cron.schedule('0 0 * * * *',clean, true);

}