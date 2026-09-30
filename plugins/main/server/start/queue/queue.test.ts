/** @jest-environment node */
import cron from 'node-cron';
import {
  WAZUH_QUEUE_MAX_DELAY_MS,
  WAZUH_QUEUE_MAX_JOBS,
  WAZUH_QUEUE_MAX_JOBS_PER_USER,
} from '../../../common/constants';
import { addJobToQueue, jobQueueRun, queue } from './index';

jest.mock('node-cron', () => ({
  __esModule: true,
  default: { schedule: jest.fn() },
}));

const inMs = (ms: number) => new Date(Date.now() + ms);
const job = (startAt: Date, owner = 'alice') => ({
  startAt,
  owner,
  run: jest.fn(),
});

beforeEach(() => {
  queue.splice(0);
  jest.clearAllMocks();
});

describe('delayed jobs queue', () => {
  it('rejects an invalid start date and one beyond the max delay', () => {
    const invalid = { added: false, reason: 'invalid_start' };

    expect(addJobToQueue(job(new Date(NaN)))).toEqual(invalid);
    expect(addJobToQueue(job(inMs(WAZUH_QUEUE_MAX_DELAY_MS + 60000)))).toEqual(
      invalid,
    );
    expect(queue).toHaveLength(0);
    expect(addJobToQueue(job(inMs(WAZUH_QUEUE_MAX_DELAY_MS)))).toEqual({
      added: true,
    });
    expect(queue).toHaveLength(1);
  });

  it('rejects a new job when the queue is full without evicting any', () => {
    for (let i = 0; i < WAZUH_QUEUE_MAX_JOBS; i++) {
      addJobToQueue(job(inMs(1000), `user-${i}`));
    }
    const pending = [...queue];

    expect(addJobToQueue(job(inMs(1000), 'another'))).toEqual({
      added: false,
      reason: 'queue_full',
    });
    expect(queue).toEqual(pending);
  });

  it('rejects a job of a user at the limit while another user still gets in', () => {
    for (let i = 0; i < WAZUH_QUEUE_MAX_JOBS_PER_USER; i++) {
      expect(addJobToQueue(job(inMs(1000), 'alice'))).toEqual({ added: true });
    }

    expect(addJobToQueue(job(inMs(1000), 'alice'))).toEqual({
      added: false,
      reason: 'owner_queue_full',
    });
    expect(addJobToQueue(job(inMs(1000), 'bob'))).toEqual({ added: true });
    expect(queue).toHaveLength(WAZUH_QUEUE_MAX_JOBS_PER_USER + 1);
  });

  it('runs due jobs and prunes invalid or expired ones even when nothing is due', async () => {
    const logger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const context = { wazuh: { logger } };
    jobQueueRun(context);
    const tick = (cron.schedule as jest.Mock).mock.calls[0][1];
    const stale = [
      job(new Date(NaN)),
      job(inMs(WAZUH_QUEUE_MAX_DELAY_MS + 60000)),
    ];
    const upcoming = job(inMs(30000));

    queue.push(...stale, upcoming);
    await tick();

    expect(queue).toEqual([upcoming]);
    expect(stale.map(({ run }) => run.mock.calls.length)).toEqual([0, 0]);
    expect(logger.warn).toHaveBeenCalledTimes(1);

    const due = job(inMs(-1000));
    queue.push(due);
    await tick();

    expect(due.run).toHaveBeenCalledTimes(1);
    expect(due.run).toHaveBeenCalledWith(context);
    expect(queue).toEqual([upcoming]);
  });
});
