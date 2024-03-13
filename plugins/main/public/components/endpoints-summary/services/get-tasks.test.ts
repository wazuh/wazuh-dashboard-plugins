import { API_NAME_TASK_STATUS } from '../../../../common/constants';
import { WzRequest } from '../../../react-services/wz-request';
import { getTasks } from './get-tasks';

jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

describe('getTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve tasks', async () => {
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: [
            {
              task_id: 1,
              agent_id: '001',
              status: API_NAME_TASK_STATUS.DONE,
              command: 'upgrade',
            },
            {
              task_id: 2,
              agent_id: '002',
              status: API_NAME_TASK_STATUS.DONE,
              command: 'upgrade',
            },
          ],
          total_affected_items: 2,
          failed_items: [],
          total_failed_items: 0,
        },
        error: 0,
        message: 'Success',
      },
    });

    const result = await getTasks({
      status: API_NAME_TASK_STATUS.DONE,
      command: 'upgrade',
      limit: 10,
    });

    expect(WzRequest.apiReq).toHaveBeenCalledWith('GET', '/tasks/status', {
      params: {
        status: API_NAME_TASK_STATUS.DONE,
        command: 'upgrade',
        limit: 10,
        offset: 0,
        q: undefined,
        wait_for_complete: true,
      },
    });

    expect(result).toEqual({
      affected_items: [
        {
          task_id: 1,
          agent_id: '001',
          status: API_NAME_TASK_STATUS.DONE,
          command: 'upgrade',
        },
        {
          task_id: 2,
          agent_id: '002',
          status: API_NAME_TASK_STATUS.DONE,
          command: 'upgrade',
        },
      ],
      total_affected_items: 2,
    });
  });
});
