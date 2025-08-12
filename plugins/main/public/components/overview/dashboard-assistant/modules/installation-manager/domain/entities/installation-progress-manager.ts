import { StepExecutionState, StepResultState } from '../enums';
import { StepState, InstallationProgress } from '../types';
import { InstallationAIAssistantStep } from './installation-ai-assistant-step';

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

    this.progress = {
      currentStep: 0,
      totalSteps: steps.length,
      steps: steps.map(step => ({
        stepName: step.getName(),
        executionState: StepExecutionState.PENDING,
      })),
      progressGlobalState: StepExecutionState.PENDING,
    };
  }

  public getProgress(): InstallationProgress {
    // Return a cloned snapshot to avoid external mutations
    return {
      currentStep: this.progress.currentStep,
      totalSteps: this.progress.totalSteps,
      steps: this.progress.steps.map(step => ({ ...step })),
      progressGlobalState: this.progress.progressGlobalState,
    };
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
      this.succeedStep(i, step);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.failStep(i, step, error);
      throw error;
    } finally {
      // Advance the internal index to the next step
      this.progress.currentStep = i + 1;
      this.inProgress = false;
    }
  }

  public startStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.progress.steps.length) {
      this.progress.currentStep = stepIndex;
      this.progress.steps[stepIndex] = {
        ...this.progress.steps[stepIndex],
        executionState: StepExecutionState.RUNNING,
      };
      this.progress.progressGlobalState = StepExecutionState.RUNNING;
      this.notifyProgress();
    }
  }

  public succeedStep(
    stepIndex: number,
    step: InstallationAIAssistantStep,
  ): void {
    this.completeStep(
      stepIndex,
      StepResultState.SUCCESS,
      step.getSuccessMessage(),
    );
  }

  public failStep(
    stepIndex: number,
    step: InstallationAIAssistantStep,
    error: Error,
  ): void {
    this.completeStep(
      stepIndex,
      StepResultState.FAIL,
      step.getFailureMessage(),
      error,
    );
  }

  private completeStep(
    stepIndex: number,
    resultState: StepResultState,
    message?: string,
    error?: Error,
  ): void {
    if (stepIndex >= 0 && stepIndex < this.progress.steps.length) {
      this.progress.steps[stepIndex] = {
        ...this.progress.steps[stepIndex],
        executionState: StepExecutionState.FINISHED,
        resultState,
        message,
        error,
      };

      // Update overall state
      if (resultState === StepResultState.FAIL) {
        this.progress.progressGlobalState = StepExecutionState.FINISHED;
      } else if (stepIndex === this.progress.steps.length - 1) {
        // Last step completed
        this.progress.progressGlobalState = StepExecutionState.FINISHED;
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
    this.progress.progressGlobalState = StepExecutionState.PENDING;
    this.notifyProgress();
  }

  private notifyProgress(): void {
    if (this.onProgressChange) {
      this.onProgressChange(this.getProgress());
    }
  }
}
