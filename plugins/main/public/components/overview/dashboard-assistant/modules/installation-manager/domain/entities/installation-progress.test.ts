import { InstallationProgress } from './installation-progress';
import { ExecutionState, StepResultState } from '../enums';
import type { StepState } from '../types';

describe('InstallationProgress', () => {
  const baseSteps: StepState[] = [
    { stepName: 'S1', state: ExecutionState.PENDING },
    { stepName: 'S2', state: ExecutionState.PENDING },
  ];

  it('initializes with defaults and clones input steps', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    expect(progress.currentStep).toBe(0);
    expect(progress.totalSteps).toBe(2);
    expect(progress.globalState).toBe(ExecutionState.PENDING);
    expect(progress.steps).not.toBe(baseSteps);
    expect(progress.steps.map(s => s.stepName)).toEqual(['S1', 'S2']);
  });

  it('startStep sets current step to RUNNING and global state to RUNNING', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    const changed = progress.startStep(0);
    expect(changed).toBe(true);
    expect(progress.currentStep).toBe(0);
    expect(progress.steps[0].state).toBe(ExecutionState.RUNNING);
    expect(progress.globalState).toBe(ExecutionState.RUNNING);
  });

  it('succeedStep completes current step with SUCCESS and keeps global RUNNING if not last', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.succeedStep('ok');
    expect(progress.steps[0].state).toBe(ExecutionState.FINISHED);
    expect(progress.steps[0].resultState).toBe(StepResultState.SUCCESS);
    expect(progress.steps[0].message).toBe('ok');
    expect(progress.globalState).toBe(ExecutionState.RUNNING);
  });

  it('failStep completes current step with FAIL and sets global to FINISHED', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(1);
    const err = new Error('boom');
    progress.failStep('bad', err);
    expect(progress.steps[1].state).toBe(ExecutionState.FINISHED);
    expect(progress.steps[1].resultState).toBe(StepResultState.FAIL);
    expect(progress.steps[1].message).toBe('bad');
    expect(progress.steps[1].error).toBe(err);
    expect(progress.globalState).toBe(ExecutionState.FINISHED);
  });

  it('completeStep returns false when currentStep is invalid', () => {
    const progress = new InstallationProgress({ steps: [] });
    const changed = progress.completeStep(StepResultState.SUCCESS, 'noop');
    expect(changed).toBe(false);
  });

  it('updates global state to FINISHED when last step succeeds', () => {
    const onlyOne: StepState[] = [
      { stepName: 'Only', state: ExecutionState.PENDING },
    ];
    const progress = new InstallationProgress({ steps: onlyOne });
    progress.startStep(0);
    progress.succeedStep('done');
    expect(progress.globalState).toBe(ExecutionState.FINISHED);
    expect(progress.isGlobalStateFinished()).toBe(true);
  });

  it('isStepAvailable validates bounds', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    expect(progress.isStepPositionValid(0)).toBe(true);
    expect(progress.isStepPositionValid(1)).toBe(true);
    expect(progress.isStepPositionValid(2)).toBe(false);
    expect(progress.isStepPositionValid(-1)).toBe(false);
  });

  it('updateStep merges updates without dropping existing fields', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.updateStep(0, { message: 'msg' });
    expect(progress.steps[0].stepName).toBe('S1');
    expect(progress.steps[0].message).toBe('msg');
  });

  it('areAllStepsSuccessful returns true when all are SUCCESS or WARNING', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.completeStep(StepResultState.SUCCESS, 'ok');
    progress.startStep(1);
    progress.completeStep(StepResultState.WARNING, 'warn');
    expect(progress.areAllStepsSuccessful()).toBe(true);
  });

  it('areAllStepsSuccessful returns false if any step failed', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.completeStep(StepResultState.SUCCESS, 'ok');
    progress.startStep(1);
    progress.completeStep(StepResultState.FAIL, 'bad', new Error('x'));
    expect(progress.areAllStepsSuccessful()).toBe(false);
  });

  it('clone returns a deep copy (mutations do not affect original)', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    const cloned = progress.clone();
    cloned.steps[0].message = 'changed';
    expect(progress.steps[0].message).toBeUndefined();
    expect(cloned).not.toBe(progress);
  });
});
