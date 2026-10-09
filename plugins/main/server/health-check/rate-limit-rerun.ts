import type { Logger } from 'opensearch_dashboards/server';
import type { InitializationTaskRunContext } from './types';

export interface RateLimitRerun {
  schedule: (taskName: string, ctx: InitializationTaskRunContext) => boolean;
  clear: (taskName: string) => void;
  stop: () => void;
}

export const nextRunMessage = (scheduled: boolean) =>
  scheduled
    ? 'The check runs again in about a minute.'
    : 'The check runs again on the next scheduled run.';

/** Runs a rate limited health check task again once the rate limit window is over. */
export const createRateLimitRerun = ({
  getTask,
  logger,
  delayMs = 60000,
  staggerMs = 5000,
  maxReruns = 2,
}: {
  getTask: (taskName: string) => {
    run: (ctx: InitializationTaskRunContext) => Promise<unknown>;
  };
  logger: Logger;
  delayMs?: number;
  staggerMs?: number;
  maxReruns?: number;
}): RateLimitRerun => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const reruns = new Map<string, number>();

  const run = async (taskName: string, ctx: InitializationTaskRunContext) => {
    timers.delete(taskName);

    try {
      await getTask(taskName).run({
        ...ctx,
        context: { ...ctx.context, scope: 'internal-scheduled' },
      });
    } catch (error) {
      logger.debug(
        `Could not run again the task [${taskName}]: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  return {
    schedule(taskName, ctx) {
      if (timers.has(taskName)) {
        return true;
      }

      const count = reruns.get(taskName) ?? 0;

      if (count >= maxReruns) {
        return false;
      }

      const timer = setTimeout(
        () => run(taskName, ctx),
        delayMs + staggerMs * timers.size,
      );

      timers.set(taskName, timer);
      reruns.set(taskName, count + 1);

      return true;
    },
    clear(taskName) {
      reruns.delete(taskName);
    },
    stop() {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    },
  };
};
