import type { StepExecutionState, StepResultState } from '../enums';

export interface StepState {
  stepName: string;
  executionState: StepExecutionState;
  resultState?: StepResultState;
  message?: string;
  error?: Error;
}
