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
    for (const job of jobs) {
      const schedulerJob:SchedulerJob = new SchedulerJob(job, this.server);
      this.schedulerJobs.push(schedulerJob);
      schedulerJob.run()
      const task = cron.schedule(
        job.interval,
        () => schedulerJob.run(),
      )
    }
  }
}