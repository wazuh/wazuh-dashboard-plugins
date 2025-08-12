import { StepExecutionState, StepResultState } from '../enums';
import { StepState, InstallationProgress } from '../types';
import { InstallationAIAssistantStep } from './installation-ai-assistant-step';

export class InstallationProgressManager {
  private readonly progress: InstallationProgress;
  // Internal index for the current step
  private currentIndex = 0;

  constructor(
    steps: InstallationAIAssistantStep[],
    private onProgressChange?: (progress: InstallationProgress) => void,
  ) {
    if (steps.length === 0) {
      throw new Error('At least one step name must be provided');
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
    return { ...this.progress };
  }

  public async runStep(
    step: InstallationAIAssistantStep,
    executor: () => Promise<void>,
  ): Promise<void> {
    const i = this.currentIndex;
    if (i < 0 || i >= this.progress.steps.length) {
      throw new Error('No more steps to run');
    }

    this.startStep(i);
    try {
      await executor();
      this.succeedStep(i, step);
    } catch (err) {
      this.failStep(i, step, err as Error);
      throw err;
    } finally {
      // Advance the internal index to the next step
      this.currentIndex = i + 1;
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

  public getFailedSteps(): StepState[] {
    return this.progress.steps.filter(
      step => step.resultState === StepResultState.FAIL,
    );
  }

  private notifyProgress(): void {
    if (this.onProgressChange) {
      this.onProgressChange(this.getProgress());
    }
  }
}
