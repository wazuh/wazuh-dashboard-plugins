import { AvailableUpdates } from '../../../common/types';

export const mockAvailableUpdates: AvailableUpdates = {
  apiId: 'manager',
  last_check: '2023-09-29T16:06:52Z',
  mayor: [
    {
      description:
        '## Manager\r\n\r\n### Added\r\n\r\n- Added support for Arch Linux OS in Vulnerability Detector...',
      published_date: '2022-05-05T16:06:52Z',
      semver: {
        mayor: 4,
        minor: 0,
        patch: 0,
      },
      tag: 'v4.0.0',
      title: 'Wazuh v4.0.0',
    },
  ],
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
        minor: 4,
        patch: 0,
      },
      tag: 'v4.4.0',
      title: 'Wazuh v4.4.0',
    },
    {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-06-20T13:20:11Z',
      semver: {
        mayor: 4,
        minor: 5,
        patch: 0,
      },
      tag: 'v4.5.0',
      title: 'Wazuh v4.5.0',
    },
  ],
  patch: [
    {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-06-20T13:20:11Z',
      semver: {
        mayor: 4,
        minor: 5,
        patch: 1,
      },
      tag: 'v4.5.1',
      title: 'Wazuh v4.5.1',
    },
  ],
};
