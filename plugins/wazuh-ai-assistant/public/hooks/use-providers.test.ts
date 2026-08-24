import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpSetup } from '../../../../src/core/public';
import { PROVIDERS_CHANGED_EVENT } from '../services/settings-service';
import { useProviders } from './use-providers';

/**
 * Covers the provider list/selection state both chat mounts share (the app shell and the header
 * flyout): initial load and default selection, selection stability across refreshes, and the two
 * failure shapes (rejection and a request that never settles).
 */

const mockList = jest.fn();

jest.mock('../services/settings-service', () => ({
  // Keeps the module's real `PROVIDERS_CHANGED_EVENT`, which the hook subscribes to and the tests
  // below dispatch. Stubbing it out would make both sides agree on `undefined`.
  ...jest.requireActual('../services/settings-service'),
  SettingsService: jest.fn().mockImplementation(() => ({
    list: () => mockList(),
  })),
}));

const http = {} as HttpSetup;

const provider = (id: string, isDefault = false) => ({
  id,
  name: id,
  providerType: 'anthropic',
  isDefault,
});

describe('useProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the providers and selects the default one', async () => {
    mockList.mockResolvedValue([provider('a'), provider('b', true)]);

    const { result } = renderHook(() => useProviders(http));
    expect(result.current.providersLoaded).toBe(false);

    await waitFor(() => expect(result.current.providersLoaded).toBe(true));
    expect(result.current.providers).toHaveLength(2);
    expect(result.current.selectedProviderId).toBe('b');
    expect(result.current.providersError).toBeNull();
  });

  it('falls back to the first provider when none is marked default', async () => {
    mockList.mockResolvedValue([provider('a'), provider('b')]);

    const { result } = renderHook(() => useProviders(http));

    await waitFor(() => expect(result.current.selectedProviderId).toBe('a'));
  });

  it('keeps the current selection when a refresh still contains it', async () => {
    mockList.mockResolvedValue([provider('a', true), provider('b')]);

    const { result } = renderHook(() => useProviders(http));
    await waitFor(() => expect(result.current.providersLoaded).toBe(true));

    act(() => result.current.setSelectedProviderId('b'));
    act(() => result.current.refreshProviders());

    await waitFor(() => expect(result.current.selectedProviderId).toBe('b'));
  });

  it('reports an error when the request fails', async () => {
    mockList.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useProviders(http));

    await waitFor(() => expect(result.current.providersLoaded).toBe(true));
    expect(result.current.providersError).toMatch(/Could not load/);
  });

  it('clears the load deadline when the consumer unmounts', () => {
    jest.useFakeTimers();
    try {
      mockList.mockReturnValue(new Promise(() => undefined));

      const { unmount } = renderHook(() => useProviders(http));
      expect(jest.getTimerCount()).toBe(1);

      unmount();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops waiting on a request that never settles', () => {
    jest.useFakeTimers();
    try {
      mockList.mockReturnValue(new Promise(() => undefined));

      const { result } = renderHook(() => useProviders(http));
      expect(result.current.providersLoaded).toBe(false);

      act(() => {
        jest.advanceTimersByTime(20_000);
      });

      expect(result.current.providersLoaded).toBe(true);
      expect(result.current.providersError).toMatch(/timed out/);
    } finally {
      jest.useRealTimers();
    }
  });

  /**
   * Provider CRUD done on the Settings page has to reach EVERY mounted consumer, including the
   * header flyout's own independent instance, which no prop callback from the Settings page can
   * reach (both views stay mounted side by side). The Settings page announces it with
   * `PROVIDERS_CHANGED_EVENT`; the hook refreshes on it.
   */
  describe('cross-instance refresh (wazuh-dashboard#1512)', () => {
    it('refetches when a provider change is announced', async () => {
      mockList.mockResolvedValue([provider('a', true)]);

      const { result } = renderHook(() => useProviders(http));
      await waitFor(() => expect(result.current.providersLoaded).toBe(true));
      expect(mockList).toHaveBeenCalledTimes(1);

      // A provider was added elsewhere (the Settings page, in the other mounted view).
      mockList.mockResolvedValue([provider('a', true), provider('b')]);
      act(() => {
        window.dispatchEvent(new Event(PROVIDERS_CHANGED_EVENT));
      });

      await waitFor(() => expect(result.current.providers).toHaveLength(2));
      expect(mockList).toHaveBeenCalledTimes(2);
      // The existing selection survives, same as any other refresh.
      expect(result.current.selectedProviderId).toBe('a');
    });

    it('re-selects a default when the previously selected provider was deleted', async () => {
      mockList.mockResolvedValue([provider('a'), provider('b', true)]);

      const { result } = renderHook(() => useProviders(http));
      await waitFor(() => expect(result.current.selectedProviderId).toBe('b'));

      mockList.mockResolvedValue([provider('a', true)]);
      act(() => {
        window.dispatchEvent(new Event(PROVIDERS_CHANGED_EVENT));
      });

      await waitFor(() => expect(result.current.selectedProviderId).toBe('a'));
    });

    it('stops listening once the consumer unmounts', async () => {
      mockList.mockResolvedValue([provider('a', true)]);

      const { result, unmount } = renderHook(() => useProviders(http));
      await waitFor(() => expect(result.current.providersLoaded).toBe(true));
      expect(mockList).toHaveBeenCalledTimes(1);

      unmount();
      window.dispatchEvent(new Event(PROVIDERS_CHANGED_EVENT));

      expect(mockList).toHaveBeenCalledTimes(1);
    });
  });
});
