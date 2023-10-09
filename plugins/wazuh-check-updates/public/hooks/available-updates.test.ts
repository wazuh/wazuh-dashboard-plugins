import { renderHook, act } from '@testing-library/react-hooks';
import { useAvailableUpdates } from './available-updates';
import { API_UPDATES_STATUS, AvailableUpdates } from '../../common/types';
import { getCore } from '../plugin-services';

jest.mock('../plugin-services', () => ({
  getCore: jest.fn().mockReturnValue({
    http: {
      get: jest.fn().mockResolvedValue({
        last_check_date: '2023-09-30T14:00:00.000Z',
        apis_available_updates: [
          {
            api_id: 'api id',
            current_version: '4.3.1',
            status: 'availableUpdates',
            last_available_patch: {
              description:
                '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
              published_date: '2022-05-18T10:12:43Z',
              semver: {
                major: 4,
                minor: 3,
                patch: 8,
              },
              tag: 'v4.3.8',
              title: 'Wazuh v4.3.8',
            },
          },
        ],
      }),
    },
  }),
}));

describe('useAvailableUpdates hook', () => {
  test('should fetch initial data without any error', async () => {
    const mockAvailableUpdates: AvailableUpdates = {
      last_check_date: '2023-09-30T14:00:00.000Z',
      apis_available_updates: [
        {
          api_id: 'api id',
          current_version: '4.3.1',
          status: 'availableUpdates' as API_UPDATES_STATUS,
          last_available_patch: {
            description:
              '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
            published_date: '2022-05-18T10:12:43Z',
            semver: {
              major: 4,
              minor: 3,
              patch: 8,
            },
            tag: 'v4.3.8',
            title: 'Wazuh v4.3.8',
          },
        },
      ],
    };

    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.apisAvailableUpdates).toEqual(
      mockAvailableUpdates.apis_available_updates
    );
    expect(result.current.isLoading).toBeFalsy();
  });

  test('should update availableUpdates', async () => {
    const mockAvailableUpdates: AvailableUpdates = {
      last_check_date: '2023-09-30T14:00:00.000Z',
      apis_available_updates: [
        {
          api_id: 'api id',
          current_version: '4.3.1',
          status: 'availableUpdates' as API_UPDATES_STATUS,
          last_available_patch: {
            description:
              '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
            published_date: '2022-05-18T10:12:43Z',
            semver: {
              major: 4,
              minor: 3,
              patch: 8,
            },
            tag: 'v4.3.8',
            title: 'Wazuh v4.3.8',
          },
        },
      ],
    };
    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    await waitForNextUpdate();
    expect(result.current.isLoading).toBeFalsy();

    act(() => {
      result.current.refreshAvailableUpdates(true);
    });

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.apisAvailableUpdates).toEqual(
      mockAvailableUpdates.apis_available_updates
    );
    expect(result.current.isLoading).toBeFalsy();
  });

  test('should handle error while fetching data', async () => {
    jest.setTimeout(30000);
    const mockErrorMessage = 'Some error occurred';
    const core = getCore();
    core.http.get = jest.fn().mockRejectedValue(mockErrorMessage);

    const { result, waitForNextUpdate } = renderHook(() => useAvailableUpdates());

    expect(result.current.isLoading).toBeTruthy();

    await waitForNextUpdate();
    expect(result.current.error).toBe(mockErrorMessage);
    expect(result.current.isLoading).toBeFalsy();
  });
});
