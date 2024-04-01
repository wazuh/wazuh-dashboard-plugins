import { paginatedAgentsRequestService } from './paginated-agents-request';
import { WzRequest } from '../../../react-services/wz-request';

jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

describe('paginatedAgentsRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should paginate agents and handle API responses correctly', async () => {
    (WzRequest.apiReq as jest.Mock).mockImplementation(
      async (method, endpoint, options) => {
        if (options.params.agents_list === 'agent1,agent2') {
          return {
            data: {
              data: {
                affected_items: ['agent1', 'agent2'],
                total_affected_items: 2,
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
                affected_items: ['agent3'],
                total_affected_items: 1,
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
      method: 'PUT' as any,
      url: '/agents/group',
      agentIds: ['agent1', 'agent2', 'agent3'],
      groupId: 'group1',
      pageSize: 2,
    };

    const result = await paginatedAgentsRequestService(params);

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'PUT',
      '/agents/group',
      {
        params: {
          group_id: 'group1',
          agents_list: 'agent1,agent2',
          wait_for_complete: true,
        },
      },
      { returnOriginalResponse: true },
    );

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'PUT',
      '/agents/group',
      {
        params: {
          group_id: 'group1',
          agents_list: 'agent3',
          wait_for_complete: true,
        },
      },
      { returnOriginalResponse: true },
    );

    expect(result).toEqual({
      data: {
        data: {
          affected_items: ['agent1', 'agent2', 'agent3'],
          total_affected_items: 3,
          failed_items: [],
          total_failed_items: 0,
        },
        error: 0,
        message: 'Success',
      },
    });
  });

  it('should paginate agents and handle API responses with failed items', async () => {
    (WzRequest.apiReq as jest.Mock).mockImplementation(
      async (method, endpoint, options) => {
        if (options.params.agents_list === 'agent1,agent2') {
          return {
            data: {
              data: {
                affected_items: ['agent1'],
                total_affected_items: 1,
                failed_items: [
                  {
                    error: {
                      code: '001',
                      message: 'agent error',
                      remediation: 'example remediation',
                    },
                    id: ['agent2'],
                  },
                ],
                total_failed_items: 1,
              },
              error: 1,
              message: 'agent2 error',
            },
          };
        } else {
          return {
            data: {
              data: {
                affected_items: [],
                total_affected_items: 0,
                failed_items: [
                  {
                    error: {
                      code: '001',
                      message: 'agent error',
                      remediation: 'example remediation',
                    },
                    id: ['agent3'],
                  },
                ],
                total_failed_items: 1,
              },
              error: 1,
              message: 'agent3 error',
            },
          };
        }
      },
    );

    const params = {
      method: 'PUT' as any,
      url: '/agents/group',
      agentIds: ['agent1', 'agent2', 'agent3'],
      groupId: 'group1',
      pageSize: 2,
    };

    const result = await paginatedAgentsRequestService(params);

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'PUT',
      '/agents/group',
      {
        params: {
          group_id: 'group1',
          agents_list: 'agent1,agent2',
          wait_for_complete: true,
        },
      },
      { returnOriginalResponse: true },
    );

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'PUT',
      '/agents/group',
      {
        params: {
          group_id: 'group1',
          agents_list: 'agent3',
          wait_for_complete: true,
        },
      },
      { returnOriginalResponse: true },
    );

    expect(result).toEqual({
      data: {
        data: {
          affected_items: ['agent1'],
          total_affected_items: 1,
          failed_items: [
            {
              error: {
                code: '001',
                message: 'agent error',
                remediation: 'example remediation',
              },
              id: ['agent2', 'agent3'],
            },
          ],
          total_failed_items: 2,
        },
        error: 2,
        message: 'agent2 error, agent3 error',
      },
    });
  });
});
