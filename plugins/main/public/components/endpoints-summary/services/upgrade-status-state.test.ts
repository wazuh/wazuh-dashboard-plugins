import { upgradeStatusState } from './upgrade-status-state';

describe('upgradeStatusState', () => {
  afterEach(() => {
    upgradeStatusState.reset();
  });

  it('has nothing pending by default', () => {
    expect(upgradeStatusState.hasPending()).toBe(false);
    expect(upgradeStatusState.getPendingAgents()).toEqual([]);
  });

  it('tracks agents and stamps a trackedAtMs', () => {
    const before = Date.now();
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    const after = Date.now();

    expect(upgradeStatusState.hasPending()).toBe(true);
    const [pending] = upgradeStatusState.getPendingAgents();
    expect(pending.id).toBe('001');
    expect(pending.version).toBe('4.5.0');
    expect(pending.trackedAtMs).toBeGreaterThanOrEqual(before);
    expect(pending.trackedAtMs).toBeLessThanOrEqual(after);
  });

  it('accumulates agents across multiple trackUpgrade calls', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    upgradeStatusState.trackUpgrade([{ id: '002', version: '4.5.0' }]);

    expect(
      upgradeStatusState.getPendingAgents().map(agent => agent.id),
    ).toEqual(['001', '002']);
  });

  it('does not duplicate an agent already being tracked', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);

    expect(upgradeStatusState.getPendingAgents()).toHaveLength(1);
  });

  it('removeAgents drops only the given ids', () => {
    upgradeStatusState.trackUpgrade([
      { id: '001', version: '4.5.0' },
      { id: '002', version: '4.5.0' },
    ]);

    upgradeStatusState.removeAgents(['001']);

    expect(
      upgradeStatusState.getPendingAgents().map(agent => agent.id),
    ).toEqual(['002']);
  });

  it('trackUpgrade with an empty list is a no-op', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    upgradeStatusState.trackUpgrade([]);

    expect(upgradeStatusState.getPendingAgents()).toHaveLength(1);
  });

  it('reset clears all tracked agents', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    upgradeStatusState.reset();

    expect(upgradeStatusState.hasPending()).toBe(false);
  });
});
