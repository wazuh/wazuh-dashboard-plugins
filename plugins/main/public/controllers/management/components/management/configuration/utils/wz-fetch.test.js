/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import { getCurrentConfig } from './wz-fetch';
import { getAgentReportedConfiguration } from './agent-config-service';
import { WzRequest } from '../../../../../../react-services/wz-request';

jest.mock('./agent-config-service', () => ({
  getAgentReportedConfiguration: jest.fn(),
}));

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

describe('getCurrentConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('agent context', () => {
    it('returns the reported configuration keyed by module', async () => {
      const content = {
        agent: { agent: { notify_time: 10 } },
        fim: { syscheck: { disabled: 'no' } },
      };
      getAgentReportedConfiguration.mockResolvedValue({
        content,
        modules: ['agent', 'fim'],
      });

      await expect(getCurrentConfig('001', [], false)).resolves.toEqual(
        content,
      );
      expect(getAgentReportedConfiguration).toHaveBeenCalledWith('001');
    });

    it('does not call the Server API', async () => {
      getAgentReportedConfiguration.mockResolvedValue({
        content: {},
        modules: [],
      });

      await getCurrentConfig('001', [], false);

      expect(WzRequest.apiReq).not.toHaveBeenCalled();
    });

    it('returns an empty configuration when the agent has never reported', async () => {
      getAgentReportedConfiguration.mockResolvedValue(null);

      await expect(getCurrentConfig('001', [], false)).resolves.toEqual({});
    });

    it('does not require sections', async () => {
      getAgentReportedConfiguration.mockResolvedValue({
        content: { fim: {} },
        modules: ['fim'],
      });

      await expect(getCurrentConfig('001')).resolves.toEqual({ fim: {} });
    });
  });

  describe('manager context', () => {
    it('keeps requesting each section from the cluster endpoint', async () => {
      WzRequest.apiReq.mockResolvedValue({
        data: {
          data: {
            total_affected_items: 1,
            affected_items: [{ rootcheck: { disabled: 'no' } }],
          },
        },
      });

      const result = await getCurrentConfig(
        'node01',
        [{ component: 'syscheck', configuration: 'rootcheck' }],
        'node01',
      );

      expect(WzRequest.apiReq).toHaveBeenCalledWith(
        'GET',
        '/cluster/node01/configuration/syscheck/rootcheck',
        {},
      );
      expect(result).toEqual({
        'syscheck-rootcheck': { rootcheck: { disabled: 'no' } },
      });
      expect(getAgentReportedConfiguration).not.toHaveBeenCalled();
    });

    it('returns an empty section when the node reports no items', async () => {
      WzRequest.apiReq.mockResolvedValue({
        data: { data: { total_affected_items: 0, affected_items: [] } },
      });

      const result = await getCurrentConfig(
        'node01',
        [{ component: 'monitor', configuration: 'global' }],
        'node01',
      );

      expect(result).toEqual({ 'monitor-global': {} });
    });

    it('rejects a request without sections', async () => {
      await expect(getCurrentConfig('node01', [], 'node01')).rejects.toThrow(
        'Invalid parameters',
      );
    });

    it('rejects an incomplete section', async () => {
      await expect(
        getCurrentConfig('node01', [{ component: 'syscheck' }], 'node01'),
      ).rejects.toThrow('Invalid section');
    });
  });

  it('rejects a missing agent id', async () => {
    await expect(getCurrentConfig(undefined, [], false)).rejects.toThrow(
      'Invalid parameters',
    );
  });
});
