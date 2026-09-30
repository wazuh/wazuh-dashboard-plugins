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
import { RequestHandlerContext } from 'src/core/server';
import {
  WAZUH_QUEUE_CRON_FREQ,
  WAZUH_QUEUE_MAX_DELAY_MS,
  WAZUH_QUEUE_MAX_JOBS,
  WAZUH_QUEUE_MAX_JOBS_PER_USER,
} from '../../../common/constants';

export interface IQueueJob {
  /** Date object to start the job */
  startAt: Date;
  /** Who scheduled the job. It limits how many jobs a user keeps pending */
  owner: string;
  /** Function to execute */
  run: (context: RequestHandlerContext) => Promise<void> | void;
}

export type QueueJobAdmission =
  | { added: true }
  | {
      added: false;
      reason: 'invalid_start' | 'queue_full' | 'owner_queue_full';
    };

export let queue: IQueueJob[] = [];

/**
 * Check a delay is an integer number of milliseconds within the allowed range.
 * @param value Delay to check
 */
export function isValidJobDelay(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= WAZUH_QUEUE_MAX_DELAY_MS
  );
}

function isValidStartAt(startAt: Date, now: number) {
  return (
    startAt instanceof Date &&
    startAt.getTime() <= now + WAZUH_QUEUE_MAX_DELAY_MS
  );
}

/**
 * Add a job to the queue if its start time and the queue limits allow it.
 * @param job Job to add to queue
 */
export function addJobToQueue(job: IQueueJob): QueueJobAdmission {
  if (!isValidStartAt(job.startAt, Date.now())) {
    return { added: false, reason: 'invalid_start' };
  }
  if (queue.length >= WAZUH_QUEUE_MAX_JOBS) {
    return { added: false, reason: 'queue_full' };
  }
  const ownerJobs = queue.filter(({ owner }) => owner === job.owner).length;
  if (ownerJobs >= WAZUH_QUEUE_MAX_JOBS_PER_USER) {
    return { added: false, reason: 'owner_queue_full' };
  }
  queue.push(job);
  return { added: true };
}

async function executePendingJobs(context: any) {
  try {
    if (!queue || !queue.length) return;
    const now = Date.now();
    const dueJobs: IQueueJob[] = [];
    const waitingJobs: IQueueJob[] = [];
    let droppedJobs = 0;
    for (const job of queue) {
      if (!isValidStartAt(job.startAt, now)) {
        droppedJobs++;
      } else if (job.startAt.getTime() <= now) {
        dueJobs.push(job);
      } else {
        waitingJobs.push(job);
      }
    }
    queue = waitingJobs;
    if (droppedJobs) {
      context.wazuh.logger.warn(
        `Dropped ${droppedJobs} delayed jobs with an invalid or out-of-range start time`,
      );
    }
    context.wazuh.logger.debug(`Pending jobs: ${dueJobs.length}`);

    for (const job of dueJobs) {
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
