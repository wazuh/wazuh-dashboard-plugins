// To launch this file
// yarn test:jest --testEnvironment node --verbose server/jobs/queue.test

import { addJobToQueue, jobQueueRun, queue } from './index';

jest.setTimeout(60000); // Set jest timeout to 60000ms to allow the job is run and removed from queue

describe.skip('Queue jobs', () => {
  it('Add job to queue', () => {
    addJobToQueue({
      startAt: new Date(new Date().getTime() + 15000),
      run: () => {},
    });
    expect(queue.length).toBe(1);
  });

  it('Sure that job was executed and removed from queue', () => {
    jobQueueRun({});
    function wait(time: number) {
      return new Promise((res) => {
        setTimeout(res, time);
      });
    }
    return wait(50000).then(() => {
      expect(queue.length).toBe(0);
    });
  });
});
