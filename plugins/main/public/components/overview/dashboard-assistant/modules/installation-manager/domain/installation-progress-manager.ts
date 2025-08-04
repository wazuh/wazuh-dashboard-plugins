import {
  StepExecutionState,
  StepResultState,
  StepState,
  InstallationProgress,
} from './types';

export class InstallationProgressManager {
  private readonly progress: InstallationProgress;

  constructor(
    stepNames: string[],
    private progressCallback?: (progress: InstallationProgress) => void,
  ) {
    if (stepNames.length === 0) {
      throw new Error('At least one step name must be provided');
    }

    this.progress = {
      currentStep: 0,
      totalSteps: stepNames.length,
      steps: stepNames.map(name => ({
        stepName: name,
        executionState: StepExecutionState.WAITING,
      })),
      overallState: StepExecutionState.WAITING,
    };
  }

  public getProgress(): InstallationProgress {
    return { ...this.progress };
  }

  public startStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.progress.steps.length) {
      this.progress.currentStep = stepIndex;
      this.progress.steps[stepIndex] = {
        ...this.progress.steps[stepIndex],
        executionState: StepExecutionState.PROCESSING,
        startTime: new Date(),
      };
      this.progress.overallState = StepExecutionState.PROCESSING;
      this.notifyProgress();
    }
  }

  public completeStep(
    stepIndex: number,
    resultState: StepResultState,
    message?: string,
    data?: any,
    error?: Error,
  ): void {
    if (stepIndex >= 0 && stepIndex < this.progress.steps.length) {
      this.progress.steps[stepIndex] = {
        ...this.progress.steps[stepIndex],
        executionState: StepExecutionState.FINISHED,
        resultState,
        message,
        data,
        error,
        endTime: new Date(),
      };

      // Update overall state
      if (resultState === StepResultState.FAIL) {
        this.progress.overallState = StepExecutionState.FINISHED;
      } else if (stepIndex === this.progress.steps.length - 1) {
        // Last step completed
        this.progress.overallState = StepExecutionState.FINISHED;
      }

      this.notifyProgress();
    }
  }

  public hasFailedSteps(): boolean {
    return this.progress.steps.some(
      step => step.resultState === StepResultState.FAIL,
    );
  }

  public isCompleted(): boolean {
    return this.progress.steps.every(
      step => step.executionState === StepExecutionState.FINISHED,
    );
  }

  public getFailedSteps(): StepState[] {
    return this.progress.steps.filter(
      step => step.resultState === StepResultState.FAIL,
    );
  }

  public getCompletedStepsData(): Record<string, any> {
    const data: Record<string, any> = {};
    this.progress.steps.forEach(step => {
      if (step.data && step.resultState === StepResultState.SUCCESS) {
        data[step.stepName] = step.data;
      }
    });
    return data;
  }

  private notifyProgress(): void {
    if (this.progressCallback) {
      this.progressCallback(this.getProgress());
    }
  }
}
