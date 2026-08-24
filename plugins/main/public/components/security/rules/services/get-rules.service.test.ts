/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import GetRulesService from './get-rules.service';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('GetRulesService', () => {
  beforeEach(() => {
    apiReq.mockReset();
    apiReq.mockResolvedValue({
      data: { data: { affected_items: [], total_affected_items: 0 } },
    });
  });

  it('requests a clean URL without a hardcoded sort query string', async () => {
    await GetRulesService(0, 10, '+name');

    expect(apiReq.mock.calls[0][1]).toBe('/security/rules');
  });

  it('sends the sort as a request param', async () => {
    await GetRulesService(0, 10, '-name');

    expect(apiReq.mock.calls[0][2]).toEqual({
      params: { offset: 0, limit: 10, sort: '-name' },
    });
  });

  it('defaults to the table default sort when none is provided', async () => {
    await GetRulesService();

    expect(apiReq.mock.calls[0][2].params.sort).toBe('+id');
  });
});
