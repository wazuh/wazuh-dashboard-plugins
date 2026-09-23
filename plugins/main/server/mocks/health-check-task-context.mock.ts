export const TASK_RESULT = Symbol.for('healthcheck.taskResult');

// This plugin's CI job runs on a platform build that may lack the constructors,
// so the mock builds its own.
const taskResult = {
  ok: (data?: unknown) => ({ [TASK_RESULT]: true, status: 'ok', data }),
  warning: (message: string, data?: unknown) => ({
    [TASK_RESULT]: true,
    status: 'warning',
    message,
    data,
  }),
  error: (message: string, data?: unknown) => ({
    [TASK_RESULT]: true,
    status: 'error',
    message,
    data,
  }),
};

/** Adds the result constructors the platform passes to every health check task. */
export const withTaskResult = <C extends object>(ctx: C) => ({
  ...ctx,
  taskResult,
});
