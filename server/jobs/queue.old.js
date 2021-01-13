/*
 * Wazuh app - Add delayed jobs to a queue.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import cron from 'node-cron';
import { log } from '../logger';

let jobs = [];
const CRON_FREQ = '0/15 * * * * *'; // Every 15 seconds

export class Queue {
  static addJob(job) {
    log('queue:addJob', `New job added`, 'debug');
    jobs.push(job);
  }

  static async run(job) {
    try {
      if (job.type === 'request') {
        await this.apiInterceptor.request(
          job.method,
          job.fullUrl,
          job.data,
          job.options
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async executePendingJobs() {
    try {
      if (!jobs || !jobs.length) return;
      const now = new Date();
      const pendingJobs = jobs.filter(item => item.startAt <= now);
      log(
        'queue:executePendingJobs',
        `Pending jobs: ${pendingJobs.length}`,
        'debug'
      );
      if (!pendingJobs || !pendingJobs.length) return;
      jobs = jobs.filter(item => item.startAt > now);

      for (const job of pendingJobs) {
        try {
          await Queue.run(job);
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      jobs = [];
      log('queue:executePendingJobs', error.message || error);
      return Promise.reject(error);
    }
  }

  static launchCronJob() {
    cron.schedule(
      CRON_FREQ,
      async () => {
        try {
          await Queue.executePendingJobs();
        } catch (error) {
          log('queue:launchCronJob', error.message || error);
        }
      },
      true
    );
  }
}
