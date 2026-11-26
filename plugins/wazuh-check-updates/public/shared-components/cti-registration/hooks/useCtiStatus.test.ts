import { renderHook, act } from '@testing-library/react';
import { CTI_FOCUS_REFRESH_MIN_MS, useCtiStatus } from './useCtiStatus';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { fetchCtiRegistrationStatus } from '../../../services/cti-registration-status';

jest.mock('../../../services/cti-registration-status', () => ({
  fetchCtiRegistrationStatus: jest.fn(),
}));

const mockedFetchCtiRegistrationStatus =
  fetchCtiRegistrationStatus as jest.Mock;

/**
 * Mimics the real fetchCtiRegistrationStatus/hydrateCtiFlowFromServer
 * timing: ctiFlowState is only hydrated once the (async) call resolves,
 * never before. Pre-seeding ctiFlowState before renderHook would hide bugs
 * in effects that only re-evaluate ctiFlowState on a stale dependency array.
 */
function mockRegisteredResolution() {
  mockedFetchCtiRegistrationStatus.mockImplementation(async () => {
    // A real microtask yield before hydrating ctiFlowState — matching an
    // actual network round trip — so effects that run synchronously during
    // the same commit as the mount fetch still observe the pre-hydration
    // (unregistered) state, exactly like production timing.
    await Promise.resolve();
    ctiFlowState.setSubscription({
      message: {
        is_registered: true,
        plan: { name: 'basic', is_public: true },
      },
      status: 200,
    } as any);
    return { statusCode: 200, message: 'registered' };
  });
}

describe('useCtiStatus — post-registration steady-state re-poll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    ctiFlowState.reset();
    mockedFetchCtiRegistrationStatus.mockReset();
    mockedFetchCtiRegistrationStatus.mockResolvedValue({
      statusCode: 404,
      message: '',
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('polls at the configured interval once the initial hydration resolves the environment as registered', async () => {
    mockRegisteredResolution();

    renderHook(() => useCtiStatus(0, 30));

    // Initial mount fetch: ctiFlowState is NOT registered yet at render
    // time — it only becomes registered once this resolves.
    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);
  });

  it('sends the re-poll as a system request so it does not extend the session', async () => {
    mockRegisteredResolution();

    renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });
    // The read on mount follows the user's navigation: it is a regular request.
    expect(mockedFetchCtiRegistrationStatus).toHaveBeenLastCalledWith({
      asSystemRequest: undefined,
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledWith({
      asSystemRequest: true,
    });
  });

  it('clamps the interval to a minimum of 5 seconds', async () => {
    mockRegisteredResolution();

    renderHook(() => useCtiStatus(0, 1));

    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(4999);
      await Promise.resolve();
    });
    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);
  });

  it('does not poll when not registered', async () => {
    renderHook(() => useCtiStatus(0, 30));

    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });

  it('clears the timer on unmount', async () => {
    mockRegisteredResolution();

    const { unmount } = renderHook(() => useCtiStatus(0, 30));

    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });

  it('skips the network call while the tab is hidden but keeps ticking', async () => {
    mockRegisteredResolution();

    renderHook(() => useCtiStatus(0, 30));

    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });

    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
    });
    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });

    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
    });
    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);
  });
});

describe('useCtiStatus — freshness guard on remount / visibility focus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    ctiFlowState.reset();
    mockedFetchCtiRegistrationStatus.mockReset();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not re-fetch on remount (e.g. re-entering the tab) if already polled recently', async () => {
    mockRegisteredResolution();

    const { unmount } = renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);

    unmount();
    mockedFetchCtiRegistrationStatus.mockClear();

    // Simulates the OSD chrome tearing down and re-mounting the nav
    // control shortly after — well within the configured interval.
    renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });

  it('re-fetches on remount once the configured interval has actually elapsed', async () => {
    mockRegisteredResolution();

    const { unmount } = renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });
    unmount();
    mockedFetchCtiRegistrationStatus.mockClear();

    jest.advanceTimersByTime(30001);

    renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);
  });

  it('ignores a visibilitychange focus event when already polled recently', async () => {
    mockRegisteredResolution();

    renderHook(() => useCtiStatus(0, 30));
    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchCtiRegistrationStatus.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });
});

describe('useCtiStatus — refreshOnFocus', () => {
  const settle = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const comeBack = async (event: 'visibilitychange' | 'focus') => {
    await act(async () => {
      if (event === 'focus') {
        window.dispatchEvent(new Event('focus'));
      } else {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    ctiFlowState.reset();
    mockedFetchCtiRegistrationStatus.mockReset();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['visibilitychange', 'focus'] as const)(
    'reads the status on %s although the polling interval has not passed',
    async event => {
      mockRegisteredResolution();
      renderHook(() => useCtiStatus(0, 30, { refreshOnFocus: true }));
      await settle();
      mockedFetchCtiRegistrationStatus.mockClear();

      jest.advanceTimersByTime(CTI_FOCUS_REFRESH_MIN_MS);
      await comeBack(event);

      expect(mockedFetchCtiRegistrationStatus).toHaveBeenCalledTimes(1);
    },
  );

  it('skips the read when the status was read moments ago', async () => {
    mockRegisteredResolution();
    renderHook(() => useCtiStatus(0, 30, { refreshOnFocus: true }));
    await settle();
    mockedFetchCtiRegistrationStatus.mockClear();

    jest.advanceTimersByTime(CTI_FOCUS_REFRESH_MIN_MS - 1000);
    await comeBack('focus');

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });

  it('does not listen to window focus without the option', async () => {
    mockRegisteredResolution();
    renderHook(() => useCtiStatus(0, 30));
    await settle();
    mockedFetchCtiRegistrationStatus.mockClear();

    jest.advanceTimersByTime(CTI_FOCUS_REFRESH_MIN_MS);
    await comeBack('focus');

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', async () => {
    mockRegisteredResolution();
    const { unmount } = renderHook(() =>
      useCtiStatus(0, 30, { refreshOnFocus: true }),
    );
    await settle();
    unmount();
    mockedFetchCtiRegistrationStatus.mockClear();

    jest.advanceTimersByTime(CTI_FOCUS_REFRESH_MIN_MS);
    await comeBack('focus');

    expect(mockedFetchCtiRegistrationStatus).not.toHaveBeenCalled();
  });
});
