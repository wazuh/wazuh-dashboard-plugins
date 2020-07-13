import { jobs, SchedulerJob } from './index';
import { configuredJobs } from './configured-jobs';
import { schedule } from 'node-cron';

export class SchedulerHandler {
  server: object;
  schedulerJobs: SchedulerJob[];
  constructor(server) {
    this.server = server;
    this.schedulerJobs = [];
  }

  run() {
    for (const job in configuredJobs({})) {
      const schedulerJob:SchedulerJob = new SchedulerJob(job, this.server);
      this.schedulerJobs.push(schedulerJob);
      const task = schedule(
        jobs[job].interval,
        () => schedulerJob.run(),
      );
    }
  }
}