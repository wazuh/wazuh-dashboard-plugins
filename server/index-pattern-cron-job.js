/*
 * Wazuh app - Module for refreshing all known fields every 2 minutes
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { checkKnownFields } from './lib/refresh-known-fields';
import cron from 'node-cron';
import { ElasticWrapper } from './lib/elastic-wrapper';
import { log } from './logger';

export class IndexPatternCronJob {
  /**
   * @param {Object} server Hapi.js server object provided by Kibana
   */
  constructor(server) {
    this.server = server;
    this.wzWrapper = new ElasticWrapper(server);
    this.CRON_FREQ = '0 */2 * * * *'; // Every 2 minutes
  }

  /**
   * Check all known fields for all Wazuh valid index patterns, every "this.CRON_FREQ".
   * This function is wrapped into a double try/catch block because we
   * don't want to kill the Node.js process or to stop the app execution.
   * This is not a reason to stop, a log is just enough to advice the user.
   */
  async run() {
    try {
      // Launch the Cron job
      cron.schedule(
        this.CRON_FREQ,
        async () => {
          try {
            // Call the proper method to refresh the known fields
            await checkKnownFields(
              this.wzWrapper,
              false,
              this.server,
              false,
              true
            );
          } catch (error) {
            // Await execution failed
            log(
              ':IndexPatternCronJob:checkKnownFields',
              error.message || error
            );
          }
        },
        true
      );
      log(
        'IndexPatternCronJob:create-job',
        'Index pattern cron job started',
        'debug'
      );
    } catch (error) {
      // Cron job creation failed
      log(':IndexPatternCronJob:create-job', error.message || error);
    }
  }
}
