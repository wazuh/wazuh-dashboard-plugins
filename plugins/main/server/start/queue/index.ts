/*
 * Wazuh app - Add delayed jobs to a queue.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import cron from 'node-cron';
import { WAZUH_QUEUE_CRON_FREQ } from '../../../common/constants';

export let queue = [];

export interface IQueueJob {
  /** Date object to start the job */
  startAt: Date;
  /** Function to execute */
  run: () => void;
}

/**
 * Add a job to the queue.
 * @param job Job to add to queue
 */
export function addJobToQueue(job: IQueueJob) {
  queue.push(job);
}

async function executePendingJobs(context: any) {
  try {
    if (!queue || !queue.length) return;
    const now: Date = new Date();
    const pendingJobs: IQueueJob[] = queue.filter(item => item.startAt <= now);
    context.wazuh.logger.debug(`Pending jobs: ${pendingJobs.length}`);
    if (!pendingJobs || !pendingJobs.length) {
      return;
    }
    queue = queue.filter((item: IQueueJob) => item.startAt > now);

    for (const job of pendingJobs) {
      try {
        await job.run(context);
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    queue = [];
    return Promise.reject(error);
  }
}

/**
 * Run the job queue it plugin start.
 * @param context
 */
export function jobQueueRun(context) {
  cron.schedule(WAZUH_QUEUE_CRON_FREQ, async () => {
    try {
      await executePendingJobs(context);
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
    }
  });
}
