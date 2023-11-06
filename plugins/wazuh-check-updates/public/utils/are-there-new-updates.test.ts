import {
  API_UPDATES_STATUS,
  ApiAvailableUpdates,
  UserPreferencesDimissedUpdate,
} from '../../common/types';
import { areThereNewUpdates } from './are-there-new-updates';

describe('areThereNewUpdates function', () => {
  it('should return true', async () => {
    const mockApisAvailableUpdates: ApiAvailableUpdates[] = [
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
    ];
    const mockLastDismissedUpdates: UserPreferencesDimissedUpdate[] = [];

    const result = areThereNewUpdates(mockApisAvailableUpdates, mockLastDismissedUpdates);

    expect(result).toBe(true);
  });

  it('should return false', async () => {
    const mockApisAvailableUpdates: ApiAvailableUpdates[] = [
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
    ];
    const mockLastDismissedUpdates: UserPreferencesDimissedUpdate[] = [
      { api_id: 'api id', last_patch: 'v4.3.8' },
    ];

    const result = areThereNewUpdates(mockApisAvailableUpdates, mockLastDismissedUpdates);

    expect(result).toBe(false);
  });

  it('should return true', async () => {
    const mockApisAvailableUpdates: ApiAvailableUpdates[] = [
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
    ];
    const mockLastDismissedUpdates: UserPreferencesDimissedUpdate[] = [
      { api_id: 'api id', last_patch: 'v4.3.9' },
    ];

    const result = areThereNewUpdates(mockApisAvailableUpdates, mockLastDismissedUpdates);

    expect(result).toBe(true);
  });
});
