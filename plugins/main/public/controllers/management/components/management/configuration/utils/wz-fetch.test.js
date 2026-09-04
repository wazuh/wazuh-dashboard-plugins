/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import { getCurrentConfig, saveFileCluster } from './wz-fetch';
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
        [{ component: 'request', configuration: 'remote' }],
        'node01',
      );

      expect(result).toEqual({ 'request-remote': {} });
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

/* Characterization of the only live manager-save path, before removing the
dead `saveNodeConfiguration`/`saveConfiguration`/`getXML`/`getJSON` exports. */
describe('saveFileCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the raw text with origin=raw, then validates', async () => {
    WzRequest.apiReq
      .mockResolvedValueOnce({}) // PUT .../configuration
      .mockResolvedValueOnce({ data: { data: { status: 'OK' } } }); // GET validation

    await saveFileCluster('<wazuh_config></wazuh_config>', 'node01');

    expect(WzRequest.apiReq).toHaveBeenNthCalledWith(
      1,
      'PUT',
      '/cluster/node01/configuration',
      { body: '<wazuh_config></wazuh_config>', origin: 'raw' },
    );
    expect(WzRequest.apiReq).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/cluster/configuration/validation',
      {},
    );
  });

  it('rejects with the validation error details when the manager reports invalid config', async () => {
    WzRequest.apiReq.mockResolvedValueOnce({}).mockResolvedValueOnce({
      data: {
        data: { status: 'FAIL', details: [{ path: 'wazuh_config' }] },
      },
    });

    await expect(
      saveFileCluster('<wazuh_config></wazuh_config>', 'node01'),
    ).rejects.toEqual({
      status: 'FAIL',
      details: [{ path: 'wazuh_config' }],
    });
  });

  it('propagates a failure from the PUT request', async () => {
    WzRequest.apiReq.mockRejectedValueOnce(new Error('network error'));

    await expect(
      saveFileCluster('<wazuh_config></wazuh_config>', 'node01'),
    ).rejects.toThrow('network error');
  });
});
