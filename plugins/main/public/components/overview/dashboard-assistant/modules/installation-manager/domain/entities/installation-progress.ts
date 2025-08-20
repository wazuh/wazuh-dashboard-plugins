import { ExecutionState, StepResultState } from '../enums';
import { StepState } from '../types';
import { Observer, Subject } from 'rxjs';

export class InstallationProgress {
  private currentStep: number;
  private totalSteps: number;
  private steps: StepState[];
  private globalState: ExecutionState;
  private subject$: Subject<void> = new Subject<void>();

  constructor(params?: {
    steps?: StepState[];
    currentStep?: number;
    globalState?: ExecutionState;
  }) {
    this.currentStep = params?.currentStep || 0;
    this.totalSteps = params?.steps?.length || 0;
    this.steps = params?.steps?.map(step => ({ ...step })) || [];
    this.globalState = params?.globalState || ExecutionState.PENDING;
  }

  public getCurrentStep() {
    return this.currentStep;
  }

  public getSteps() {
    return [...this.steps];
  }

  public startStep(stepIndex: number) {
    if (this.isStepPositionValid(stepIndex)) {
      const i = this.currentStep;
      if (i < 0 || i >= this.totalSteps || this.isFinished()) {
        throw new Error('All steps have been completed');
      }
      this.updateExecutionStepState(stepIndex, ExecutionState.RUNNING);
      this.globalState = ExecutionState.RUNNING;
      this.notify();
    }
  }

  public succeedStep(stepIndex: number, message: string): void {
    this.completeStep(stepIndex, StepResultState.SUCCESS, message);
  }

  public failStep(stepIndex: number, message: string, error: Error): void {
    this.completeStep(stepIndex, StepResultState.FAIL, message, error);
  }

  public completeStep(
    stepIndex: number,
    resultState: StepResultState,
    message?: string,
    error?: Error,
  ) {
    if (this.isStepPositionValid(stepIndex)) {
      this.updateStep(stepIndex, {
        state:
          resultState === StepResultState.SUCCESS
            ? ExecutionState.FINISHED_SUCCESSFULLY
            : resultState === StepResultState.WARNING
            ? ExecutionState.FINISHED_WITH_WARNINGS
            : ExecutionState.FAILED,
        message,
        error,
      });

      this.updateGlobalState(resultState);
      this.currentStep++;
      this.notify();
    }
  }

  public updateGlobalState(resultState: StepResultState): void {
    if (resultState === StepResultState.FAIL) {
      this.globalState = ExecutionState.FAILED;
    }
    if (this.currentStep === this.totalSteps - 1) {
      if (this.hasWarnings()) {
        this.globalState = ExecutionState.FINISHED_WITH_WARNINGS;
      } else {
        this.globalState = ExecutionState.FINISHED_SUCCESSFULLY;
      }
    }
  }

  public hasWarnings(): boolean {
    return this.steps.some(
      step => step.state === ExecutionState.FINISHED_WITH_WARNINGS,
    );
  }

  public isStepPositionValid(stepIndex: number): boolean {
    return stepIndex >= 0 && stepIndex < this.totalSteps;
  }

  public updateExecutionStepState(
    stepIndex: number,
    state: ExecutionState,
  ): void {
    this.updateStep(stepIndex, { state: state });
  }

  public updateStep(stepIndex: number, update: Partial<StepState>): void {
    const step = this.steps[stepIndex];
    if (step) {
      this.steps[stepIndex] = { ...step, ...update };
    }
  }

  public subscribe(
    observerOrNext?:
      | Partial<Observer<void>>
      | ((value: void) => void)
      | undefined,
  ): () => void {
    const unsubscribe = this.subject$.subscribe(observerOrNext);
    return () => {
      unsubscribe.unsubscribe();
    };
  }

  public notify(): void {
    this.subject$.next();
  }

  public reset(): void {
    this.currentStep = 0;
    this.steps = this.steps.map(step => ({
      stepName: step.stepName,
      state: ExecutionState.PENDING,
    }));
    this.globalState = ExecutionState.PENDING;
    this.notify();
  }

  public hasFailedSteps(): boolean {
    return this.getFailedSteps().length > 0;
  }

  public getFailedSteps(): StepState[] {
    return this.steps.filter(step => step.state === ExecutionState.FAILED);
  }

  public isFinishedSuccessfully(): boolean {
    return this.globalState === ExecutionState.FINISHED_SUCCESSFULLY;
  }

  public isFinishedWithWarnings(): boolean {
    return this.globalState === ExecutionState.FINISHED_WITH_WARNINGS;
  }

  public isFinished(): boolean {
    return this.isFinishedSuccessfully() || this.isFinishedWithWarnings();
  }

  public isRunning(): boolean {
    return this.globalState === ExecutionState.RUNNING;
  }

  public clone() {
    return new InstallationProgress({
      currentStep: this.currentStep,
      steps: this.steps.map(step => ({ ...step })),
      globalState: this.globalState,
    });
  }

  public hasFailed(): boolean {
    return (
      this.globalState === ExecutionState.FAILED &&
      !!this.getFailedSteps().length
    );
  }
}
