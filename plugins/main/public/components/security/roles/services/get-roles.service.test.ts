/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import GetRolesService from './get-roles.service';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('GetRolesService', () => {
  beforeEach(() => {
    apiReq.mockReset();
    apiReq.mockResolvedValue({
      data: { data: { affected_items: [], total_affected_items: 0 } },
    });
  });

  it('requests a clean URL without a hardcoded sort query string', async () => {
    await GetRolesService();

    expect(apiReq.mock.calls[0][1]).toBe('/security/roles');
  });

  it('keeps the previous default sort when called without options', async () => {
    await GetRolesService();

    expect(apiReq.mock.calls[0][2].params.sort).toBe('+name');
  });

  it('keeps the default when called with an empty options object', async () => {
    // useApiService invokes the service as service({})
    await GetRolesService({});

    expect(apiReq.mock.calls[0][2].params.sort).toBe('+name');
  });

  it('forwards an explicit sort', async () => {
    await GetRolesService({ sort: '-id' });

    expect(apiReq.mock.calls[0][2].params.sort).toBe('-id');
  });
});
