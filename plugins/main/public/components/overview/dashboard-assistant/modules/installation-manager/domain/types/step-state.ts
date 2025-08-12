import type { ExecutionState } from '../enums';

export interface StepState {
  stepName: string;
  state: ExecutionState;
  message?: string;
  error?: Error;
}
