import { StepExecutionState, StepResultState } from '../enums';
import { StepState } from '../types';
import { InstallationAIAssistantStep } from './installation-ai-assistant-step';
import { InstallationProgress } from './installation-progress';

export class InstallationProgressManager {
  private readonly progress: InstallationProgress;
  // Prevent concurrent executions
  private inProgress = false;

  constructor(
    steps: InstallationAIAssistantStep[],
    private onProgressChange?: (progress: InstallationProgress) => void,
  ) {
    if (steps.length === 0) {
      throw new Error('At least one step must be provided');
    }

    this.progress = new InstallationProgress({
      steps: steps.map(step => ({
        stepName: step.getName(),
        executionState: StepExecutionState.PENDING,
      })),
    });
  }

  public getProgress(): InstallationProgress {
    // Return a cloned snapshot to avoid external mutations
    return this.progress.clone();
  }

  public async runStep(
    step: InstallationAIAssistantStep,
    executor: () => Promise<void>,
  ): Promise<void> {
    if (this.inProgress) {
      throw new Error('A step is already running');
    }
    const i = this.progress.currentStep;
    if (i < 0 || i >= this.progress.steps.length || this.isCompleted()) {
      throw new Error('All steps have been completed');
    }

    this.inProgress = true;
    this.startStep(i);
    try {
      await executor();
      this.succeedStep(step);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.failStep(step, error);
      throw error;
    } finally {
      // Advance the internal index to the next step
      this.progress.currentStep = i + 1;
      this.inProgress = false;
    }
  }

  public startStep(stepIndex: number): void {
    if (this.progress.startStep(stepIndex)) {
      this.notifyProgress();
    }
  }

  public succeedStep(step: InstallationAIAssistantStep): void {
    this.completeStep(StepResultState.SUCCESS, step.getSuccessMessage());
  }

  public failStep(step: InstallationAIAssistantStep, error: Error): void {
    this.completeStep(StepResultState.FAIL, step.getFailureMessage(), error);
  }

  private completeStep(
    resultState: StepResultState,
    message?: string,
    error?: Error,
  ): void {
    if (this.progress.completeStep(resultState, message, error)) {
      this.notifyProgress();
    }
  }

  public hasFailedSteps(): boolean {
    return this.progress.steps.some(
      step => step.resultState === StepResultState.FAIL,
    );
  }

  public getFailedSteps(): StepState[] {
    return this.progress.steps.filter(
      step => step.resultState === StepResultState.FAIL,
    );
  }

  public isCompleted(): boolean {
    return this.progress.steps.every(
      step => step.executionState === StepExecutionState.FINISHED,
    );
  }

  // Allow reusing the manager without reinstantiation
  public reset(): void {
    this.progress.currentStep = 0;
    this.progress.steps = this.progress.steps.map(s => ({
      stepName: s.stepName,
      executionState: StepExecutionState.PENDING,
      // reset optional fields
      resultState: undefined,
      message: undefined,
      error: undefined,
    }));
    this.progress.globalState = StepExecutionState.PENDING;
    this.notifyProgress();
  }

  private notifyProgress(): void {
    if (this.onProgressChange) {
      this.onProgressChange(this.getProgress());
    }
  }
}
