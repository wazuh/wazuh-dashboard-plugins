import { INITIALIZATION_TASK } from './constants';

type RunStatusEnum = (typeof INITIALIZATION_TASK)['RUN_STATUS'];

export type InitializationTaskRunStatus = RunStatusEnum[keyof RunStatusEnum];

type RunResultEnum = (typeof INITIALIZATION_TASK)['RUN_RESULT'];

export type InitializationTaskRunResult = RunResultEnum[keyof RunResultEnum];

type ContextEnum = (typeof INITIALIZATION_TASK)['CONTEXT'];

export type InitializationTaskContext = ContextEnum[keyof ContextEnum];
