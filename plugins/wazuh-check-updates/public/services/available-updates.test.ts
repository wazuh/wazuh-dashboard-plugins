import { getAvailableUpdates } from './available-updates';
import { API_UPDATES_STATUS, AvailableUpdates } from '../../common/types';

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

describe('getAvailableUpdates functions', () => {
  test('should fetch data without any error', async () => {
    const mockAvailableUpdates: AvailableUpdates = {
      last_check_date: new Date('2023-09-30T14:00:00.000Z'),
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

    const availableUpdates = await getAvailableUpdates();

    expect(availableUpdates).toEqual({
      ...mockAvailableUpdates,
      last_check_date: '2023-09-30T14:00:00.000Z',
    });
  });
});
