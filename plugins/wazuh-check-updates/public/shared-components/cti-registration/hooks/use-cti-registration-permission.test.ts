import { renderHook, waitFor } from '@testing-library/react';
import { useCtiRegistrationPermission } from './use-cti-registration-permission';
import { fetchCtiRegistrationPermission } from '../../../services/cti-registration-permission';

jest.mock('../../../services/cti-registration-permission', () => ({
  fetchCtiRegistrationPermission: jest.fn(),
}));

const mockedFetchCtiRegistrationPermission =
  fetchCtiRegistrationPermission as jest.Mock;

const DENIED = {
  accessAllowed: false,
  missingPrivileges: ['cluster:admin/content_manager/subscription/create'],
};

describe('useCtiRegistrationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchCtiRegistrationPermission.mockResolvedValue({
      accessAllowed: true,
      missingPrivileges: [],
    });
  });

  test('does not probe when disabled', async () => {
    const { result } = renderHook(() => useCtiRegistrationPermission(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockedFetchCtiRegistrationPermission).not.toHaveBeenCalled();
    expect(result.current.accessAllowed).toBe(true);
  });

  test('starts loading and resolves to allowed', async () => {
    const { result } = renderHook(() => useCtiRegistrationPermission(true));

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockedFetchCtiRegistrationPermission).toHaveBeenCalledTimes(1);
    expect(result.current.accessAllowed).toBe(true);
  });

  test('exposes a denial and its missing privileges', async () => {
    mockedFetchCtiRegistrationPermission.mockResolvedValue(DENIED);

    const { result } = renderHook(() => useCtiRegistrationPermission(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.accessAllowed).toBe(false);
    expect(result.current.missingPrivileges).toEqual(DENIED.missingPrivileges);
  });

  test('probes again on a remount, which is what reopening the modal does', async () => {
    const first = renderHook(() => useCtiRegistrationPermission(true));
    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
    });
    first.unmount();

    mockedFetchCtiRegistrationPermission.mockResolvedValue(DENIED);
    const second = renderHook(() => useCtiRegistrationPermission(true));
    await waitFor(() => {
      expect(second.result.current.loading).toBe(false);
    });

    expect(mockedFetchCtiRegistrationPermission).toHaveBeenCalledTimes(2);
    expect(second.result.current.accessAllowed).toBe(false);
  });

  test('resets to allowed when it becomes disabled', async () => {
    mockedFetchCtiRegistrationPermission.mockResolvedValue(DENIED);
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useCtiRegistrationPermission(enabled),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => {
      expect(result.current.accessAllowed).toBe(false);
    });

    rerender({ enabled: false });

    await waitFor(() => {
      expect(result.current.accessAllowed).toBe(true);
    });
    expect(result.current.missingPrivileges).toEqual([]);
  });

  test('ignores a probe that resolves after unmount', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let resolveProbe!: (value: unknown) => void;
    mockedFetchCtiRegistrationPermission.mockReturnValue(
      new Promise(resolve => {
        resolveProbe = resolve;
      }),
    );

    const { unmount } = renderHook(() => useCtiRegistrationPermission(true));
    unmount();
    resolveProbe(DENIED);
    await waitFor(() => {
      expect(mockedFetchCtiRegistrationPermission).toHaveBeenCalledTimes(1);
    });

    // A state update on the unmounted hook would surface here as a React warning.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
