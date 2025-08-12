import { StepExecutionState, StepResultState } from '../enums';
import { StepState } from '../types';

export class InstallationProgress {
  public currentStep: number;
  public totalSteps: number;
  public steps: StepState[];
  public globalState: StepExecutionState;

  constructor(params?: {
    steps?: StepState[];
    currentStep?: number;
    globalState?: StepExecutionState;
  }) {
    this.currentStep = params?.currentStep || 0;
    this.totalSteps = params?.steps?.length || 0;
    this.steps = params?.steps?.map(step => ({ ...step })) || [];
    this.globalState = params?.globalState || StepExecutionState.PENDING;
  }

  startStep(stepIndex: number): boolean {
    if (this.isStepAvailable(stepIndex)) {
      this.currentStep = stepIndex;
      this.updateStep(stepIndex, {
        executionState: StepExecutionState.RUNNING,
      });
      this.globalState = StepExecutionState.RUNNING;
      return true;
    }
    return false;
  }

  public succeedStep(message: string): void {
    this.completeStep(StepResultState.SUCCESS, message);
  }

  public failStep(message: string, error: Error): void {
    this.completeStep(StepResultState.FAIL, message, error);
  }

  completeStep(
    resultState: StepResultState,
    message?: string,
    error?: Error,
  ): boolean {
    if (this.isStepAvailable(this.currentStep)) {
      this.updateStep(this.currentStep, {
        executionState: StepExecutionState.FINISHED,
        resultState,
        message,
        error,
      });

      this.updateGlobalState(resultState);
      return true;
    }
    return false;
  }

  updateGlobalState(resultState: StepResultState): void {
    if (
      resultState === StepResultState.FAIL ||
      this.currentStep === this.steps.length - 1
    ) {
      this.globalState = StepExecutionState.FINISHED;
    }
  }

  isStepAvailable(stepIndex: number): boolean {
    return stepIndex >= 0 && stepIndex < this.steps.length;
  }

  updateStep(stepIndex: number, update: Partial<StepState>): void {
    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];
    if (step) {
      this.steps[stepIndex] = { ...step, ...update };
    }
  }

  public isGlobalStateFinished(): boolean {
    return this.globalState === StepExecutionState.FINISHED;
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
      globalState: this.globalState,
    });
  }
}
