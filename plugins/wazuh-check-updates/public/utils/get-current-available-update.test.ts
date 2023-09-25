import { getCurrentAvailableUpdate } from './get-current-available-update';

describe('getCurrentAvailableUpdate function', () => {
  test('should return an available update', () => {
    const mockAvailabeUpdates = {
      mayor: [],
      minor: [
        {
          description:
            '## Manager\r\n\r\n### Added\r\n\r\n- Added support for Arch Linux OS in Vulnerability Detector...',
          published_date: '2022-05-05T16:06:52Z',
          semver: {
            mayor: 4,
            minor: 3,
            patch: 0,
          },
          tag: 'v4.3.0',
          title: 'Wazuh v4.3.0',
        },
        {
          description:
            '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
          published_date: '2022-05-18T10:12:43Z',
          semver: {
            mayor: 4,
            minor: 3,
            patch: 1,
          },
          tag: 'v4.3.1',
          title: 'Wazuh v4.3.1',
        },
        {
          description:
            '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
          published_date: '2022-06-20T13:20:11Z',
          semver: {
            mayor: 4,
            minor: 3,
            patch: 2,
          },
          tag: 'v4.3.2',
          title: 'Wazuh v4.3.2',
        },
      ],
      patch: [],
    };

    const currentUpdate = getCurrentAvailableUpdate(mockAvailabeUpdates);
    expect(currentUpdate).toBeDefined();
    expect(currentUpdate).toEqual({
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-06-20T13:20:11Z',
      semver: {
        mayor: 4,
        minor: 3,
        patch: 2,
      },
      tag: 'v4.3.2',
      title: 'Wazuh v4.3.2',
    });
  });
  test('should return undefined', () => {
    const mockNoAvailableUpdates = {
      mayor: [],
      minor: [],
      patch: [],
    };
    const currentUpdate = getCurrentAvailableUpdate(mockNoAvailableUpdates);
    expect(currentUpdate).toBeUndefined();
  });
  test('should return undefined', () => {
    const currentUpdate = getCurrentAvailableUpdate();
    expect(currentUpdate).toBeUndefined();
  });
});
