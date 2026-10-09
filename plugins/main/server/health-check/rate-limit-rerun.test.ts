import { createRateLimitRerun, nextRunMessage } from './rate-limit-rerun';
import type { InitializationTaskRunContext } from './types';

const ctx = {
  context: { scope: 'internal-initial' },
} as unknown as InitializationTaskRunContext;

const setup = (run = jest.fn().mockResolvedValue({})) => {
  const logger = { debug: jest.fn() };
  const getTask = jest.fn(() => ({ run }));
  const rerun = createRateLimitRerun({
    getTask,
    logger: logger as never,
    delayMs: 1000,
    staggerMs: 100,
  });

  return { rerun, run, getTask, logger };
};

const flushPromises = () =>
  new Promise(jest.requireActual('timers').setImmediate);

describe('createRateLimitRerun', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs each task again after the delay, staggered, with the scheduled scope', () => {
    const { rerun, run, getTask } = setup();

    expect(rerun.schedule('task-a', ctx)).toBe(true);
    expect(rerun.schedule('task-b', ctx)).toBe(true);

    jest.advanceTimersByTime(1000);

    expect(getTask).toHaveBeenCalledWith('task-a');
    expect(run).toHaveBeenCalledWith({
      context: { scope: 'internal-scheduled' },
    });

    jest.advanceTimersByTime(99);
    expect(getTask).not.toHaveBeenCalledWith('task-b');
    jest.advanceTimersByTime(1);
    expect(getTask).toHaveBeenCalledWith('task-b');
  });

  it('keeps one pending run per task', () => {
    const { rerun, run } = setup();

    rerun.schedule('task-a', ctx);
    expect(rerun.schedule('task-a', ctx)).toBe(true);
    jest.runAllTimers();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('stops after the consecutive re-runs until the task is cleared', () => {
    const { rerun } = setup();

    for (let i = 0; i < 2; i++) {
      expect(rerun.schedule('task-a', ctx)).toBe(true);
      jest.runAllTimers();
    }

    expect(rerun.schedule('task-a', ctx)).toBe(false);

    rerun.clear('task-a');

    expect(rerun.schedule('task-a', ctx)).toBe(true);
    expect(nextRunMessage(true)).toBe(
      'The check runs again in about a minute.',
    );
    expect(nextRunMessage(false)).toBe(
      'The check runs again on the next scheduled run.',
    );
  });

  it('cancels the pending runs on stop', () => {
    const { rerun, run } = setup();

    rerun.schedule('task-a', ctx);
    rerun.stop();
    jest.runAllTimers();

    expect(run).not.toHaveBeenCalled();
  });

  it('logs at debug level a run that fails', async () => {
    const { rerun, logger } = setup(
      jest
        .fn()
        .mockRejectedValue(
          new Error('Another instance of task task-a is running'),
        ),
    );

    rerun.schedule('task-a', ctx);
    jest.runAllTimers();
    await flushPromises();

    expect(logger.debug).toHaveBeenCalledWith(
      'Could not run again the task [task-a]: Another instance of task task-a is running',
    );
  });
});
