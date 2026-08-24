/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import GetUsersService from './get-users.service';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('GetUsersService', () => {
  beforeEach(() => {
    apiReq.mockReset();
    apiReq.mockResolvedValue({
      data: { data: { affected_items: [], total_affected_items: 0 } },
    });
  });

  it('requests a clean URL without a hardcoded sort query string', async () => {
    await GetUsersService(0, 10, '-username');

    const [method, url] = apiReq.mock.calls[0];
    expect(method).toBe('GET');
    expect(url).toBe('/security/users');
    expect(url).not.toContain('sort=');
  });

  it('sends the sort as a request param', async () => {
    await GetUsersService(10, 25, '-username');

    expect(apiReq.mock.calls[0][2]).toEqual({
      params: { offset: 10, limit: 25, sort: '-username' },
    });
  });

  it('keeps the previous default sort when none is provided', async () => {
    await GetUsersService();

    expect(apiReq.mock.calls[0][2].params.sort).toBe('+username');
  });

  it('omits the sort param when an empty sort is provided', async () => {
    await GetUsersService(0, 10, '');

    expect(apiReq.mock.calls[0][2].params).not.toHaveProperty('sort');
  });
});
