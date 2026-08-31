/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import GetPoliciesService from './get-policies.service';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

describe('GetPoliciesService', () => {
  beforeEach(() => {
    apiReq.mockReset();
    apiReq.mockResolvedValue({
      data: { data: { affected_items: [], total_affected_items: 0 } },
    });
  });

  it('sends the sort as a request param', async () => {
    await GetPoliciesService(0, 10, '-name');

    expect(apiReq.mock.calls[0][1]).toBe('/security/policies');
    expect(apiReq.mock.calls[0][2]).toEqual({
      params: { offset: 0, limit: 10, sort: '-name' },
    });
  });

  it('defaults to ascending id, matching the table default sort', async () => {
    await GetPoliciesService();

    expect(apiReq.mock.calls[0][2].params.sort).toBe('+id');
  });
});
