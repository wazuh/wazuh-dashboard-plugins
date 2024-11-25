export type InitializationTaskRunStatusNotStarted = 'not_started';
export type InitializationTaskRunStatusRunning = 'running';
export type InitializationTaskRunStatusFinished = 'finished';
export type InitializationTaskRunStatus =
  | InitializationTaskRunStatusNotStarted
  | InitializationTaskRunStatusRunning
  | InitializationTaskRunStatusFinished;

export type InitializationTaskRunResultNull = null;
export type InitializationTaskRunResultSuccess = 'success';
export type InitializationTaskRunResultFail = 'fail';
export type InitializationTaskRunResult =
  | InitializationTaskRunResultSuccess
  | InitializationTaskRunResultFail
  | InitializationTaskRunResultNull;

export type InitializationTaskContextInternal = 'internal';
export type InitializationTaskContextUser = 'user';
export type InitializationTaskContext =
  | InitializationTaskContextInternal
  | InitializationTaskContextUser;
