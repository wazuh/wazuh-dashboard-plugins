import { StepExecutionState, StepResultState } from '../enums';
import { StepState } from '../types';
import { Observer, Subject } from 'rxjs';

export class InstallationProgress {
  public currentStep: number;
  public totalSteps: number;
  public steps: StepState[];
  public globalState: StepExecutionState;
  private subject$: Subject<void> = new Subject<void>();

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

  public startStep(stepIndex: number) {
    if (this.isStepAvailable(stepIndex)) {
      this.currentStep = stepIndex;
      this.updateStep(stepIndex, {
        executionState: StepExecutionState.RUNNING,
      });
      this.globalState = StepExecutionState.RUNNING;
      this.notify();
    }
  }

  public succeedStep(message: string): void {
    this.completeStep(StepResultState.SUCCESS, message);
  }

  public failStep(message: string, error: Error): void {
    this.completeStep(StepResultState.FAIL, message, error);
  }

  public completeStep(
    resultState: StepResultState,
    message?: string,
    error?: Error,
  ) {
    if (this.isStepAvailable(this.currentStep)) {
      this.updateStep(this.currentStep, {
        executionState: StepExecutionState.FINISHED,
        resultState,
        message,
        error,
      });

      this.updateGlobalState(resultState);
      this.notify();
    }
  }

  public updateGlobalState(resultState: StepResultState): void {
    if (
      resultState === StepResultState.FAIL ||
      this.currentStep === this.steps.length - 1
    ) {
      this.globalState = StepExecutionState.FINISHED;
    }
  }

  public isStepAvailable(stepIndex: number): boolean {
    return stepIndex >= 0 && stepIndex < this.steps.length;
  }

  public updateStep(stepIndex: number, update: Partial<StepState>): void {
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
      executionState: StepExecutionState.PENDING,
    }));
    this.globalState = StepExecutionState.PENDING;
    this.notify();
  }

  public hasFailedSteps(): boolean {
    return this.steps.some(step => step.resultState === StepResultState.FAIL);
  }

  public getFailedSteps(): StepState[] {
    return this.steps.filter(step => step.resultState === StepResultState.FAIL);
  }

  public isCompleted(): boolean {
    return this.steps.every(
      step => step.executionState === StepExecutionState.FINISHED,
    );
  }

  public isInProgress(): boolean {
    return this.steps.some(
      step => step.executionState === StepExecutionState.RUNNING,
    );
  }

  public clone() {
    return new InstallationProgress({
      currentStep: this.currentStep,
      steps: this.steps.map(step => ({ ...step })),
      globalState: this.globalState,
    });
  }
}
