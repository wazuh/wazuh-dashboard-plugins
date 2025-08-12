import { StepExecutionState, StepResultState } from '../enums';
import { StepState } from '../types';

export class InstallationProgress {
  public currentStep: number;
  public totalSteps: number;
  public steps: StepState[];
  public progressGlobalState: StepExecutionState;

  constructor(params?: {
    steps?: StepState[];
    currentStep?: number;
    globalState?: StepExecutionState;
  }) {
    this.currentStep = params?.currentStep || 0;
    this.totalSteps = params?.steps?.length || 0;
    this.steps = params?.steps?.map(step => ({ ...step })) || [];
    this.progressGlobalState =
      params?.globalState || StepExecutionState.PENDING;
  }

  public isGlobalStateFinished(): boolean {
    return this.progressGlobalState === StepExecutionState.FINISHED;
  }

  public areAllStepsSuccessful(): boolean {
    return this.steps.every(
      step =>
        step.resultState === StepResultState.SUCCESS ||
        step.resultState === StepResultState.WARNING,
    );
  }

  clone() {
    return new InstallationProgress({
      currentStep: this.currentStep,
      steps: this.steps.map(step => ({ ...step })),
      globalState: this.progressGlobalState,
    });
  }
}
