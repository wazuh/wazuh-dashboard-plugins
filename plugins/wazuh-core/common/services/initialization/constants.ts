export const INITIALIZATION_TASK = {
  RUN_STATUS: {
    NOT_STARTED: 'not_started',
    RUNNING: 'running',
    FINISHED: 'finished',
  },
  RUN_RESULT: {
    NULL: null,
    SUCCESS: 'success',
    FAIL: 'fail',
  },
  CONTEXT: {
    INTERNAL: 'internal',
    USER: 'user',
  },
} as const;
