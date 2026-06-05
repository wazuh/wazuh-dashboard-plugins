import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { API_UPDATES_STATUS } from '../../../common/types';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { getSavedObject } from '../saved-object/get-saved-object';
import { setSavedObject } from '../saved-object/set-saved-object';
import { getUpdates } from './get-updates';

const mockGetSavedObject = getSavedObject as jest.Mock;
jest.mock('../saved-object/get-saved-object');

const mockSetSavedObject = setSavedObject as jest.Mock;
mockSetSavedObject.mockImplementation(() => ({}));
jest.mock('../saved-object/set-saved-object');

const mockTransportRequest = jest.fn();
const mockOpensearchClient = {
  asCurrentUser: {
    transport: {
      request: mockTransportRequest,
    },
  },
};

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
jest.mock('../../plugin-services', () => ({
  getWazuhCheckUpdatesServices: jest.fn(),
}));

describe('getUpdates function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return available updates from saved object', async () => {
    const semver = { major: 4, minor: 3, patch: 1 };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };
    const savedObject = {
      last_check_date_dashboard: new Date('2023-09-30T14:00:00.000Z'),
      current_version: `v${version}`,
      status: API_UPDATES_STATUS.UP_TO_DATE,
      last_available_patch,
    };
    mockGetSavedObject.mockImplementation(() => savedObject);

    const updates = await getUpdates();

    expect(getSavedObject).toHaveBeenCalledTimes(1);
    expect(getSavedObject).toHaveBeenCalledWith(SAVED_OBJECT_UPDATES);
    expect(updates).toEqual(savedObject);
  });

  it('should return available updates from indexer when request succeeds', async () => {
    const semver = { major: 4, minor: 3, patch: 1 };
    const version = `${semver.major}.${semver.minor}.${semver.patch}`;
    const last_available_patch = {
      description:
        '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
      published_date: '2022-05-18T10:12:43Z',
      semver,
      tag: `v${version}`,
      title: `Wazuh v${version}`,
    };

    mockTransportRequest.mockImplementationOnce(() => ({
      body: {
        message: {
          uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
          current_version: `v${version}`,
          last_available_patch,
          last_check_date: '2023-09-30T14:00:00.000Z',
        },
        status: 200,
      },
    }));

    const updates = await getUpdates(true, mockOpensearchClient as any);

    expect(updates).toEqual({
      uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
      current_version: `v${version}`,
      last_available_major: undefined,
      last_available_minor: undefined,
      last_available_patch,
      last_check_date: '2023-09-30T14:00:00.000Z',
      last_check_date_dashboard: expect.any(Date),
      status: API_UPDATES_STATUS.AVAILABLE_UPDATES,
    });
  });

  it('should return up to date when no updates in indexer response', async () => {
    mockTransportRequest.mockImplementationOnce(() => ({
      body: {
        message: {
          uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
          current_version: 'v4.3.1',
          last_check_date: '2023-09-30T14:00:00.000Z',
        },
        status: 200,
      },
    }));

    const updates = await getUpdates(true, mockOpensearchClient as any);

    expect(updates).toEqual({
      uuid: '7f828fd6-ef68-4656-b363-247b5861b84c',
      current_version: 'v4.3.1',
      last_available_major: undefined,
      last_available_minor: undefined,
      last_available_patch: undefined,
      last_check_date: '2023-09-30T14:00:00.000Z',
      last_check_date_dashboard: expect.any(Date),
      status: API_UPDATES_STATUS.UP_TO_DATE,
    });
  });

  it('should return error when indexer returns non-200 status', async () => {
    mockTransportRequest.mockImplementationOnce(() => ({
      body: {
        message: 'Unable to reach the CTI API to check for updates.',
        status: 500,
      },
    }));

    const updates = await getUpdates(true, mockOpensearchClient as any);

    expect(updates).toEqual({
      last_check_date_dashboard: expect.any(Date),
      status: API_UPDATES_STATUS.ERROR,
      error: { detail: 'Unable to reach the CTI API to check for updates.' },
    });
  });

  it('should return error when indexer request throws', async () => {
    mockTransportRequest.mockImplementationOnce(() => {
      throw new Error('Connection refused');
    });

    const updates = await getUpdates(true, mockOpensearchClient as any);

    expect(updates).toEqual({
      last_check_date_dashboard: expect.any(Date),
      status: API_UPDATES_STATUS.ERROR,
      error: {
        title: 'Connection refused',
        detail: 'Connection refused',
      },
    });
  });
});
