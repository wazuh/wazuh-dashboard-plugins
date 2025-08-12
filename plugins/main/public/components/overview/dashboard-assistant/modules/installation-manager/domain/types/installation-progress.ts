import type { StepExecutionState } from '../enums';
import type { StepState } from './step-state';

export interface InstallationProgress {
  currentStep: number;
  totalSteps: number;
  steps: StepState[];
  progressGlobalState: StepExecutionState;
}
