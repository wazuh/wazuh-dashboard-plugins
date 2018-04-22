/*
 * Wazuh app - Module for visualization deletion cron task
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const ElasticWrapper = require('./lib/elastic-wrapper');
const cron           = require('node-cron');
const { log }        = require('./logger');

module.exports = server => {
    let abort = 0;
    const wzWrapper = new ElasticWrapper(server);

    // Deletes all visualizations older than one hour ago
    const clean = async () => {
        try {
            if(abort < 3) {
                const date = new Date();
                date.setTime(date.getTime() - (60 * 60 * 1000))
                const output = await wzWrapper.deleteVisualizationByDescription(date.getTime(),true);
                if(output && output.deleted > 0) log('vis-deletion-cron.js',`Deleted ${output.deleted} visualizations with a timestamp lower than ${date.getTime()}`,'info');
                return;
            }
        } catch (error) {
            abort++;
            log('vis-deletion-cron.js', error.message || error);
        }
    }
    // Runs clean function each hour
    cron.schedule('0 0 * * * *',clean, true);
}
