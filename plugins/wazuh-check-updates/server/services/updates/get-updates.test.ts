import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { API_UPDATES_STATUS } from '../../../common/types';
import {
  getWazuhCheckUpdatesServices,
  getWazuhCore,
} from '../../plugin-services';
import { getSavedObject } from '../saved-object/get-saved-object';
import { setSavedObject } from '../saved-object/set-saved-object';
import { getUpdates } from './get-updates';

const API_ID = 'api id';

const mockGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../saved-object/get-saved-object');

const mockSetSavedObject = setSavedObject as jest.Mock;
mockSetSavedObject.mockImplementation(() => ({}));
jest.mock('../saved-object/set-saved-object');

const mockGetWazuhCore = getWazuhCore as jest.Mock;
const mockRequest = jest.fn();
const mockManageHosts = {
  get: jest.fn(() => [{ id: API_ID }]),
};
const mockGetHostsEntries = jest.fn(() => []);
mockGetWazuhCore.mockImplementation(() => {
  return {
    api: {
      client: {
        asInternalUser: {
          request: mockRequest,
        },
      },
    },
    manageHosts: mockManageHosts,
    serverAPIHostEntries: {
      getHostsEntries: mockGetHostsEntries,
    },
  };
});

const mockedGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.Mock;
mockedGetWazuhCheckUpdatesServices.mockImplementation(() => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../plugin-services');

describe('getUpdates function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return available updates from saved object', async () => {
    const semver = {
      major: 4,
      minor: 3,
      patch: 1,
    };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };
    const last_check_date = '2023-09-30T14:00:00.000Z';
    const savedObject = {
      last_check_date,
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: `v${version}`,
          status: API_UPDATES_STATUS.UP_TO_DATE,
          last_available_patch,
        },
      ],
    };
    mockGetSavedObject.mockImplementation(() => savedObject);

    const updates = await getUpdates();

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_UPDATES);

    expect(updates).toEqual(savedObject);
  });

  test('should return available updates from api', async () => {
    const semver = {
      major: 4,
      minor: 3,
      patch: 1,
    };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };
    mockRequest
      .mockImplementationOnce(() => ({
        data: {
          data: {
            api_version: version,
          },
        },
      }))
      .mockImplementationOnce(() => ({
        data: {
          data: {
            uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
            current_version: `v${version}`,
            update_check: undefined,
            last_available_major: undefined,
            last_available_minor: undefined,
            last_available_patch,
            last_check_date: undefined,
          },
        },
      }));

    const updates = await getUpdates(true);

    expect(updates).toEqual({
      last_check_date: expect.any(Date),
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: `v${version}`,
          status: API_UPDATES_STATUS.AVAILABLE_UPDATES,
          update_check: undefined,
          last_available_major: undefined,
          last_available_minor: undefined,
          last_available_patch,
          last_check_date: undefined,
        },
      ],
    });
  });

  it('should return available updates from api when in the first request, api_version is undefined', async () => {
    const semver = {
      major: 4,
      minor: 3,
      patch: 1,
    };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };
    mockRequest
      .mockImplementationOnce(() => ({
        data: {
          data: {
            api_version: undefined,
          },
        },
      }))
      .mockImplementationOnce(() => ({
        data: {
          data: {
            uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
            current_version: `v${version}`,
            update_check: undefined,
            last_available_major: undefined,
            last_available_minor: undefined,
            last_available_patch,
            last_check_date: undefined,
          },
        },
      }));

    const updates = await getUpdates(true);

    expect(updates).toEqual({
      last_check_date: expect.any(Date),
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: `v${version}`,
          status: API_UPDATES_STATUS.AVAILABLE_UPDATES,
          update_check: undefined,
          last_available_major: undefined,
          last_available_minor: undefined,
          last_available_patch,
          last_check_date: undefined,
        },
      ],
    });
  });
  it('should return available updates from api when the first request fail', async () => {
    const semver = {
      major: 4,
      minor: 3,
      patch: 1,
    };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };
    mockRequest
      .mockImplementationOnce(() => {
        throw new Error('Error');
      })
      .mockImplementationOnce(() => ({
        data: {
          data: {
            uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
            current_version: `v${version}`,
            update_check: undefined,
            last_available_major: undefined,
            last_available_minor: undefined,
            last_available_patch,
            last_check_date: undefined,
          },
        },
      }));

    const updates = await getUpdates(true);

    expect(updates).toEqual({
      last_check_date: expect.any(Date),
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: `v${version}`,
          status: API_UPDATES_STATUS.AVAILABLE_UPDATES,
          update_check: undefined,
          last_available_major: undefined,
          last_available_minor: undefined,
          last_available_patch,
          last_check_date: undefined,
        },
      ],
    });
  });
  it('should return available updates from api when the second request fail', async () => {
    const semver = {
      major: 4,
      minor: 3,
      patch: 1,
    };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    mockRequest
      .mockImplementationOnce(() => ({
        data: {
          data: {
            api_version: version,
          },
        },
      }))
      .mockImplementationOnce(() => {
        throw new Error('Error');
      });

    const updates = await getUpdates(true);

    expect(updates).toEqual({
      last_check_date: expect.any(Date),
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: `v${version}`,
          status: API_UPDATES_STATUS.ERROR,
          error: {
            detail: 'Error',
            title: 'Error',
          },
        },
      ],
    });
  });
  it('should return error from api when both requests fail', async () => {
    mockRequest
      .mockImplementationOnce(() => {
        throw new Error('Error');
      })
      .mockImplementationOnce(() => {
        throw new Error('Error');
      });

    const updates = await getUpdates(true);

    expect(updates).toEqual({
      last_check_date: expect.any(Date),
      apis_available_updates: [
        {
          api_id: API_ID,
          current_version: undefined,
          status: API_UPDATES_STATUS.ERROR,
          error: {
            detail: 'Error',
            title: 'Error',
          },
        },
      ],
    });
  });
});
