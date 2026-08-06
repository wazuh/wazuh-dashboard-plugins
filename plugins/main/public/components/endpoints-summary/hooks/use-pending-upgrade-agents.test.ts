import { act, renderHook } from '@testing-library/react';
import { usePendingUpgradeAgents } from './use-pending-upgrade-agents';
import { upgradeStatusState } from '../services/upgrade-status-state';

describe('usePendingUpgradeAgents hook', () => {
  afterEach(() => {
    // Wrapped in act(): a hook still mounted from the current test may be
    // subscribed, so this reset can synchronously trigger a state update.
    act(() => {
      upgradeStatusState.reset();
    });
  });

  it('returns an empty list when nothing is tracked', () => {
    const { result } = renderHook(() => usePendingUpgradeAgents());

    expect(result.current).toEqual([]);
  });

  it('returns already-tracked agents on mount', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);

    const { result } = renderHook(() => usePendingUpgradeAgents());

    expect(result.current.map(agent => agent.id)).toEqual(['001']);
  });

  it('re-renders when an agent is tracked after mount', () => {
    const { result } = renderHook(() => usePendingUpgradeAgents());

    act(() => {
      upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    });

    expect(result.current.map(agent => agent.id)).toEqual(['001']);
  });

  it('re-renders when an agent is removed', () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    const { result } = renderHook(() => usePendingUpgradeAgents());

    act(() => {
      upgradeStatusState.removeAgents(['001']);
    });

    expect(result.current).toEqual([]);
  });

  it('stops updating after unmount', () => {
    const { result, unmount } = renderHook(() => usePendingUpgradeAgents());

    unmount();
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);

    expect(result.current).toEqual([]);
  });
});
