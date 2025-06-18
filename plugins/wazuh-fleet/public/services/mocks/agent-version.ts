export const versionsToUpgradeMock = {
  last_check_date: '2023-09-30T14:00:00.000Z',
  apis_available_updates: [
    {
      api_id: 'api-id-1',
      current_version: '4.11.0',
      status: 'availableUpdates',
      last_available_patch: {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-05-18T10:12:43Z',
        semver: {
          major: 4,
          minor: 11,
          patch: 1,
        },
        tag: 'v4.11.1',
        title: 'Wazuh v4.11.1',
      },
    },
    {
      api_id: 'api-id-2',
      current_version: '4.11.0',
      status: 'availableUpdates',
      last_available_minor: {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-05-18T10:12:43Z',
        semver: {
          major: 4,
          minor: 12,
          patch: 0,
        },
        tag: 'v4.12.0',
        title: 'Wazuh v4.12.0',
      },
    },
    {
      api_id: 'api-id-3',
      current_version: '4.11.0',
      status: 'availableUpdates',
      last_available_major: {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-05-18T10:12:43Z',
        semver: {
          major: 5,
          minor: 0,
          patch: 0,
        },
        tag: 'v5.0.0',
        title: 'Wazuh v5.0.0',
      },
    },
  ],
};
