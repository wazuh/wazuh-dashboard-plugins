import { jobs, SchedulerJob } from './index';
import { configuredJobs } from './configured-jobs';
import cron from 'node-cron';


const schedulerJobs = [];

export function jobSchedulerRun(context){
  for (const job in configuredJobs({})) {
    const schedulerJob: SchedulerJob = new SchedulerJob(job, context);
    schedulerJobs.push(schedulerJob);
    const task = cron.schedule(
      jobs[job].interval,
      () => schedulerJob.run(),
    );
  }
}