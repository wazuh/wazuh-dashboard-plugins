import { jobs, SaveDocument, SchedulerJob } from './index';
import cron from 'node-cron';

export class SchedulerHandler {
  server: object;
  schedulerJobs: SchedulerJob[];
  constructor(server) {
    this.server = server;
    this.schedulerJobs = [];
    new SaveDocument(server)
  }

  run() {
    for (const job of Object.keys(jobs)) {
      const schedulerJob:SchedulerJob = new SchedulerJob(job, this.server);
      this.schedulerJobs.push(schedulerJob);
      const task = cron.schedule(
        jobs[job].interval,
        () => schedulerJob.run(),
      )
    }
  }
}