import { scanAgentsVulnerabilitiesService } from './scan-agents-vulnerabilities';
import { paginatedAgentsRequestService } from './paginated-agents-request';

jest.mock('./paginated-agents-request', () => ({
  paginatedAgentsRequestService: jest.fn(),
}));

describe('scanAgentsVulnerabilitiesService', () => {
  it('should request the on-demand vulnerability scan of the agents', async () => {
    const response = {
      data: {
        data: {
          affected_items: ['001', '003'],
          failed_items: [
            { error: { code: 5000, message: 'queue_full' }, id: ['002'] },
          ],
          total_affected_items: 2,
          total_failed_items: 1,
        },
        error: 2,
        message: 'Scan was requested for some agents',
      },
    };
    (paginatedAgentsRequestService as jest.Mock).mockResolvedValue(response);

    const result = await scanAgentsVulnerabilitiesService({
      agentIds: ['001', '002', '003'],
    });

    expect(paginatedAgentsRequestService).toHaveBeenCalledWith({
      method: 'PUT',
      url: '/agents/scan/vulnerability',
      agentIds: ['001', '002', '003'],
    });
    expect(result).toEqual(response);
  });
});
