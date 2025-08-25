import { ExecutionState, StepResultState } from '../enums';
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
        state: ExecutionState.PENDING,
      })),
    });

    this.progress.subscribe(() => {
      this.notifyProgress();
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
    const i = this.progress.getCurrentStep();
    if (!this.progress.isStepPositionValid(i) || this.progress.isFinished()) {
      throw new Error('All steps have been completed');
    }

    this.inProgress = true;
    this.progress.startStep(i);
    try {
      await executor();
      this.succeedStep(i, step);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.failStep(i, step, error);
      throw error;
    } finally {
      this.inProgress = false;
    }
  }

  private succeedStep(
    stepIndex: number,
    step: InstallationAIAssistantStep,
  ): void {
    this.progress.completeStep(
      stepIndex,
      StepResultState.SUCCESS,
      step.getSuccessMessage(),
    );
  }

  private failStep(
    stepIndex: number,
    step: InstallationAIAssistantStep,
    error: Error,
  ): void {
    this.progress.completeStep(
      stepIndex,
      StepResultState.FAIL,
      step.getFailureMessage(),
      error,
    );
  }

  private notifyProgress(): void {
    if (this.onProgressChange) {
      this.onProgressChange(this.getProgress());
    }
  }
}
