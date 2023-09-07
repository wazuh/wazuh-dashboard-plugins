import { AvailableUpdates } from '../../../common/types';

export const mockSuccessResponse: { data: Omit<AvailableUpdates, 'last_check'> } = {
  data: {
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
    ],
    patch: [],
  },
};

export const mockErrorResponse = {
  errors: {
    tag: ['is invalid'],
  },
};
