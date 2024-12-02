import { initializationTask } from './constants';

type RunStatusEnum = (typeof initializationTask)['RUN_STATUS'];

export type InitializationTaskRunStatus = RunStatusEnum[keyof RunStatusEnum];

type RunResultEnum = (typeof initializationTask)['RUN_RESULT'];

export type InitializationTaskRunResult = RunResultEnum[keyof RunResultEnum];

type ContextEnum = (typeof initializationTask)['CONTEXT'];

export type InitializationTaskContext = ContextEnum[keyof ContextEnum];
