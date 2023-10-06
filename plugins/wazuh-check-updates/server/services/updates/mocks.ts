import { ResponseApiAvailableUpdates } from '../../../common/types';

export const mockSuccessResponse: { data: ResponseApiAvailableUpdates[] } = {
  data: [
    {
      api_id: 'api 1',
      current_version: '3.7.2',
      last_check_date: '2022-05-05T16:06:52Z',
      last_available_major: {
        description:
          '|Part of Epic|\r\n|---|\r\n|#84|\r\n## Description\r\nThe wazuh-check-updates plugin should expose a table with information about the status of updates for each API.\r\nAdditionally, the check for updates button must perform verification for each API.\r\n## Tasks\r\n- [x] **[wazuh-check-updates Backend]** Expose an endpoint to query the new updates and their details **for each API**. The endpoint should consult the Wazuh API. **Initially the response from the Wazuh API will be mocked**\r\n- [x] **[wazuh-check-updates Backend]** Manage saved objects to save available updates **for each API**.\r\n- [ ] **[wazuh-check-updates Backend]** Run a cron job to periodically check for available updates **for each API**.\r\n- [ ] **[wazuh-check-updates Frontend]** Expose a table to show the update status **for each API** and the details of each available update.\r\n- [ ] **[wazuh-check-updates Frontend]** It must use i18n.\r\n- [ ] **[wazuh Frontend]** Consume the frontend components in the About page.\r\n- [ ] Unit tests for each development\r\n## About page mockup\r\n![image (3)](https://github.com/wazuh/wazuh-dashboard/assets/103193307/65ab3494-6c76-4197-8a25-59bd9d0723aa)\r\n',
        published_date: '2022-05-05T16:06:52Z',
        semver: {
          major: 4,
          minor: 0,
          patch: 0,
        },
        tag: 'v4.4.0',
        title: 'Wazuh v4.4.0',
      },
      last_available_minor: {
        description:
          '## Manager\r\n\r\n### Added\r\n\r\n- Added support for Arch Linux OS in Vulnerability Detector...',
        published_date: '2022-05-05T16:06:52Z',
        semver: {
          major: 3,
          minor: 8,
          patch: 0,
        },
        tag: 'v3.8.0',
        title: 'Wazuh v3.8.0',
      },
      last_available_patch: {
        description:
          '## Manager\r\n\r\n### Added\r\n\r\n- Added support for Arch Linux OS in Vulnerability Detector...',
        published_date: '2022-05-05T16:06:52Z',
        semver: {
          major: 3,
          minor: 7,
          patch: 3,
        },
        tag: 'v3.7.3',
        title: 'Wazuh v3.7.3',
      },
    },
    {
      api_id: 'api 2',
      current_version: '4.1.0',
      last_check_date: '2022-05-05T16:06:52Z',
      last_available_minor: {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-06-20T13:20:11Z',
        semver: {
          major: 4,
          minor: 2,
          patch: 0,
        },
        tag: 'v4.2.0',
        title: 'Wazuh v4.2.0',
      },
      last_available_patch: {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-05-18T10:12:43Z',
        semver: {
          major: 4,
          minor: 1,
          patch: 4,
        },
        tag: 'v4.1.4',
        title: 'Wazuh v4.1.4',
      },
    },
  ],
};

export const mockErrorResponse = {
  errors: {
    tag: ['is invalid'],
  },
};
