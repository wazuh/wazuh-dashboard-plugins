import type { TaskResultFactory } from '../../../../src/core/server';
import type { TASK_RESULT as PLATFORM_TASK_RESULT } from '../../../../src/core/common/healthcheck';

type TaskResultBrand = typeof PLATFORM_TASK_RESULT;

// Without the annotation the cast widens to `symbol`.
export const TASK_RESULT: TaskResultBrand = Symbol.for(
  'healthcheck.taskResult',
) as TaskResultBrand;

// This plugin's CI job runs on a platform build that may lack the constructors,
// so the mock builds its own.
const taskResult: TaskResultFactory = {
  ok: data => ({ [TASK_RESULT]: true, status: 'ok', data }),
  warning: (message, data) => ({
    [TASK_RESULT]: true,
    status: 'warning',
    message,
    data,
  }),
  error: (message, data) => ({
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
