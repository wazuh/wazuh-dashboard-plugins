import { renderHook, waitFor } from '@testing-library/react';
import { useUpgradeStatus } from './use-upgrade-status';
import { upgradeStatusState } from '../services/upgrade-status-state';
import { getAgentsService } from '../services';
import { getToasts } from '../../../kibana-services';

jest.mock('../services', () => ({
  getAgentsService: jest.fn(),
}));

jest.mock('../../../kibana-services', () => ({
  getToasts: jest.fn(),
}));

// Real timers, with a tiny poll interval: avoids the classic fake-timers +
// nested-promises flakiness for a self-rescheduling setTimeout loop.
jest.mock('../../../../common/constants', () => ({
  ...jest.requireActual('../../../../common/constants'),
  AGENT_UPGRADE_STATUS_POLL_INTERVAL_MS: 20,
}));

describe('useUpgradeStatus hook', () => {
  const addToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    upgradeStatusState.reset();
    (getToasts as jest.Mock).mockReturnValue({ add: addToast });
  });

  afterEach(() => {
    upgradeStatusState.reset();
  });

  it('does nothing when there are no pending agents', () => {
    const reloadAgents = jest.fn();

    renderHook(() => useUpgradeStatus(reloadAgents, 0));

    expect(getAgentsService).not.toHaveBeenCalled();
  });

  it('polls GET /agents for the pending agents right away', async () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    (getAgentsService as jest.Mock).mockResolvedValue({
      affected_items: [{ id: '001', version: '4.5.0' }],
    });

    renderHook(() => useUpgradeStatus(jest.fn(), 0));

    await waitFor(() =>
      expect(getAgentsService).toHaveBeenCalledWith({ agents: ['001'] }),
    );
  });

  it('shows a success toast and reloads once the version changes', async () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    (getAgentsService as jest.Mock).mockResolvedValue({
      affected_items: [{ id: '001', version: '4.6.0' }],
    });
    const reloadAgents = jest.fn();

    renderHook(() => useUpgradeStatus(reloadAgents, 0));

    await waitFor(() => expect(reloadAgents).toHaveBeenCalledTimes(1));

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'success',
        text: 'Agent 001 was upgraded successfully',
      }),
    );
    expect(upgradeStatusState.hasPending()).toBe(false);
  });

  it('keeps polling on the interval while the version has not changed', async () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    (getAgentsService as jest.Mock).mockResolvedValue({
      affected_items: [{ id: '001', version: '4.5.0' }],
    });
    const reloadAgents = jest.fn();

    renderHook(() => useUpgradeStatus(reloadAgents, 0));

    await waitFor(() =>
      expect(
        (getAgentsService as jest.Mock).mock.calls.length,
      ).toBeGreaterThanOrEqual(2),
    );
    expect(reloadAgents).not.toHaveBeenCalled();
  });

  it('stops polling after the component unmounts', async () => {
    upgradeStatusState.trackUpgrade([{ id: '001', version: '4.5.0' }]);
    (getAgentsService as jest.Mock).mockResolvedValue({
      affected_items: [{ id: '001', version: '4.5.0' }],
    });

    const { unmount } = renderHook(() => useUpgradeStatus(jest.fn(), 0));

    await waitFor(() => expect(getAgentsService).toHaveBeenCalledTimes(1));

    unmount();
    const callsAtUnmount = (getAgentsService as jest.Mock).mock.calls.length;
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(getAgentsService).toHaveBeenCalledTimes(callsAtUnmount);
  });
});
