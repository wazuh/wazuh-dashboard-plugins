import { InstallationProgressManager } from './installation-progress-manager';
import { InstallationAIAssistantStep } from './installation-ai-assistant-step';
import { StepExecutionState, StepResultState } from '../enums';

class TestStep extends InstallationAIAssistantStep {
  constructor(
    name: string,
    private readonly successMsg: string = 'ok',
    private readonly failureMsg: string = 'fail',
  ) {
    super({ name });
  }
  async execute(): Promise<void> {
    // no-op for tests; execution is driven by the executor passed to manager.runStep
  }
  getSuccessMessage(): string {
    return this.successMsg;
  }
  getFailureMessage(): string {
    return this.failureMsg;
  }
}

describe('InstallationProgressManager', () => {
  it('initializes progress with provided steps in PENDING state', () => {
    const steps = [new TestStep('Step 1'), new TestStep('Step 2')];
    const mgr = new InstallationProgressManager(steps);

    const snapshot = mgr.getProgress();
    expect(snapshot.steps.map(s => s.stepName)).toEqual(['Step 1', 'Step 2']);
    expect(
      snapshot.steps.every(
        s => s.executionState === StepExecutionState.PENDING,
      ),
    ).toBe(true);
    expect(snapshot.currentStep).toBe(0);
  });

  it('runStep succeeds: updates step state, advances index, and notifies progress', async () => {
    const steps = [new TestStep('S1', 'done')];
    const onProgressChange = jest.fn();
    const mgr = new InstallationProgressManager(steps, onProgressChange);

    await mgr.runStep(steps[0], async () => {
      /* success */
    });

    const p = mgr.getProgress();
    expect(p.steps[0].executionState).toBe(StepExecutionState.FINISHED);
    expect(p.steps[0].resultState).toBe(StepResultState.SUCCESS);
    expect(p.steps[0].message).toBe('done');
    expect(mgr.isCompleted()).toBe(true);
    expect(onProgressChange.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('runStep failure: marks step as FAIL with error and message, exposes failed steps', async () => {
    const steps = [new TestStep('S1', 'ok', 'boom-msg')];
    const mgr = new InstallationProgressManager(steps);

    await expect(
      mgr.runStep(steps[0], async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const p = mgr.getProgress();
    expect(p.steps[0].executionState).toBe(StepExecutionState.FINISHED);
    expect(p.steps[0].resultState).toBe(StepResultState.FAIL);
    expect(p.steps[0].message).toBe('boom-msg');
    expect(p.steps[0].error).toBeInstanceOf(Error);
    expect(mgr.hasFailedSteps()).toBe(true);
    expect(mgr.getFailedSteps().length).toBe(1);
  });

  it('prevents concurrent step execution', async () => {
    const steps = [new TestStep('S1')];
    const mgr = new InstallationProgressManager(steps);

    let resolveExec!: () => void;
    const running = mgr.runStep(
      steps[0],
      () => new Promise<void>(res => (resolveExec = res)),
    );

    await expect(mgr.runStep(steps[0], async () => {})).rejects.toThrow(
      'A step is already running',
    );

    resolveExec();
    await running;
  });

  it('throws when all steps are completed', async () => {
    const steps = [new TestStep('S1'), new TestStep('S2')];
    const mgr = new InstallationProgressManager(steps);

    await mgr.runStep(steps[0], async () => {});
    await mgr.runStep(steps[1], async () => {});

    expect(mgr.isCompleted()).toBe(true);
    await expect(mgr.runStep(steps[0], async () => {})).rejects.toThrow(
      'All steps have been completed',
    );
  });

  it('reset returns all steps to PENDING and clears result/message/error', async () => {
    const steps = [new TestStep('S1'), new TestStep('S2')];
    const onProgressChange = jest.fn();
    const mgr = new InstallationProgressManager(steps, onProgressChange);

    // Make one success and one failure
    await mgr.runStep(steps[0], async () => {});
    await expect(
      mgr.runStep(steps[1], async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow('x');

    mgr.reset();

    const p = mgr.getProgress();
    expect(p.currentStep).toBe(0);
    expect(
      p.steps.every(s => s.executionState === StepExecutionState.PENDING),
    ).toBe(true);
    expect(p.steps.every(s => s.resultState === undefined)).toBe(true);
    expect(p.steps.every(s => s.message === undefined)).toBe(true);
    expect(p.steps.every(s => s.error === undefined)).toBe(true);
    expect(mgr.hasFailedSteps()).toBe(false);
    expect(mgr.isCompleted()).toBe(false);
    expect(onProgressChange).toHaveBeenCalled();
  });

  it('getProgress returns a cloned snapshot (mutations do not affect internal state)', async () => {
    const steps = [new TestStep('S1')];
    const mgr = new InstallationProgressManager(steps);

    const snap1 = mgr.getProgress();
    // Mutate snapshot
    snap1.steps[0].executionState = StepExecutionState.FINISHED as any;

    const snap2 = mgr.getProgress();
    expect(snap2.steps[0].executionState).toBe(StepExecutionState.PENDING);
  });
});
