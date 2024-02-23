import { getAgentsService } from './get-agents';
import { WzRequest } from '../../../react-services/wz-request';

jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

describe('getAgentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should paginate agents and handle API responses correctly', async () => {
    (WzRequest.apiReq as jest.Mock).mockImplementation(
      async (method, endpoint, options) => {
        if (options.params.offset === 0) {
          return {
            data: {
              data: {
                affected_items: [
                  { id: '001', name: 'agent1' },
                  { id: '002', name: 'agent2' },
                ],
                total_affected_items: 3,
                failed_items: [],
                total_failed_items: 0,
              },
              error: 0,
              message: 'Success',
            },
          };
        } else {
          return {
            data: {
              data: {
                affected_items: [{ id: '003', name: 'agent3' }],
                total_affected_items: 3,
                failed_items: [],
                total_failed_items: 0,
              },
              error: 0,
              message: 'Success',
            },
          };
        }
      },
    );

    const params = {
      filters: {},
      pageSize: 2,
    };

    const result = await getAgentsService(params);

    expect(WzRequest.apiReq).toHaveBeenCalledWith('GET', '/agents', {
      params: {
        q: {},
        limit: 2,
        offset: 0,
        wait_for_complete: true,
      },
    });

    expect(WzRequest.apiReq).toHaveBeenCalledWith('GET', '/agents', {
      params: {
        q: {},
        limit: 2,
        offset: 2,
        wait_for_complete: true,
      },
    });

    expect(result).toEqual({
      affected_items: [
        { id: '001', name: 'agent1' },
        { id: '002', name: 'agent2' },
        { id: '003', name: 'agent3' },
      ],
      total_affected_items: 3,
    });
  });
});
