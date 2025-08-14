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
    expect(progress.getCurrentStep()).toBe(0);
    expect(progress.getSteps().length).toBe(2);
    expect(progress.isRunning()).toBe(false);
    expect(progress.getSteps()).not.toBe(baseSteps);
    expect(progress.getSteps().map(s => s.stepName)).toEqual(['S1', 'S2']);
  });

  it('startStep sets step to RUNNING and global state to RUNNING', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    expect(progress.getCurrentStep()).toBe(0);
    expect(progress.getSteps()[0].state).toBe(ExecutionState.RUNNING);
    expect(progress.isRunning()).toBe(true);
  });

  it('succeedStep completes current step with FINISHED_SUCCESSFULLY and keeps global RUNNING if not last', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.succeedStep(0, 'ok');
    const s0 = progress.getSteps()[0];
    expect(s0.state).toBe(ExecutionState.FINISHED_SUCCESSFULLY);
    expect(s0.message).toBe('ok');
    expect(progress.isRunning()).toBe(true);
  });

  it('failStep completes current step with FAILED and sets global to failed state', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(1);
    const err = new Error('boom');
    progress.failStep(1, 'bad', err);
    const s1 = progress.getSteps()[1];
    expect(s1.state).toBe(ExecutionState.FAILED);
    expect(s1.message).toBe('bad');
    expect(s1.error).toBe(err);
    expect(progress.hasFailedSteps()).toBe(true);
    expect(progress.isRunning()).toBe(false);
    expect(progress.isFinished()).toBe(false);
  });

  it('completeStep does nothing when stepIndex is invalid', () => {
    const progress = new InstallationProgress({ steps: [] });
    expect(() =>
      progress.completeStep(0, StepResultState.SUCCESS, 'noop'),
    ).not.toThrow();
    expect(progress.getCurrentStep()).toBe(0);
    expect(progress.getSteps().length).toBe(0);
  });

  it('updates global state to FINISHED_SUCCESSFULLY when last step succeeds', () => {
    const onlyOne: StepState[] = [
      { stepName: 'Only', state: ExecutionState.PENDING },
    ];
    const progress = new InstallationProgress({ steps: onlyOne });
    progress.startStep(0);
    progress.succeedStep(0, 'done');
    expect(progress.isFinishedSuccessfully()).toBe(true);
    expect(progress.isFinished()).toBe(true);
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
    expect(progress.getSteps()[0].stepName).toBe('S1');
    expect(progress.getSteps()[0].message).toBe('msg');
  });

  it('hasFailedSteps is false when steps are SUCCESS or WARNING; hasWarnings reflects warnings', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.completeStep(0, StepResultState.SUCCESS, 'ok');
    progress.startStep(1);
    progress.completeStep(1, StepResultState.WARNING, 'warn');
    expect(progress.hasFailedSteps()).toBe(false);
    expect(progress.hasWarnings()).toBe(true);
  });

  it('hasFailedSteps returns true if any step failed', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    progress.startStep(0);
    progress.completeStep(0, StepResultState.SUCCESS, 'ok');
    progress.startStep(1);
    progress.completeStep(1, StepResultState.FAIL, 'bad', new Error('x'));
    expect(progress.hasFailedSteps()).toBe(true);
  });

  it('clone returns a deep copy (mutations do not affect original)', () => {
    const progress = new InstallationProgress({ steps: baseSteps });
    const cloned = progress.clone();
    cloned.updateStep(0, { message: 'changed' });
    expect(progress.getSteps()[0].message).toBeUndefined();
    expect(cloned.getSteps()[0].message).toBe('changed');
    expect(cloned).not.toBe(progress);
  });
});
