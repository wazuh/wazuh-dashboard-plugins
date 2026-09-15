/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import { checkVDIsEnabledCluster } from './check-module-enabled';
import { clusterNodes } from '../../../../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzRequest } from '../../../../../react-services';

jest.mock(
  '../../../../../controllers/management/components/management/configuration/utils/wz-fetch',
  () => ({ clusterNodes: jest.fn() }),
);

jest.mock('../../../../../react-services', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const mockNodes = (...names: string[]) =>
  (clusterNodes as jest.Mock).mockResolvedValue({
    data: { data: { affected_items: names.map(name => ({ name })) } },
  });

const mockWmodules = (...wmodules: Record<string, unknown>[][]) => {
  const apiReq = WzRequest.apiReq as jest.Mock;
  apiReq.mockReset();
  wmodules.forEach(nodeWmodules =>
    apiReq.mockResolvedValueOnce({
      data: { data: { affected_items: [{ wmodules: nodeWmodules }] } },
    }),
  );
};

const vulnerabilityDetection = (enabled: unknown) => ({
  'vulnerability-detection': { enabled },
});

describe('checkVDIsEnabledCluster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the native boolean the server reports since 5.0.0', async () => {
    mockNodes('node01');
    mockWmodules([{ 'task-manager': {} }, vulnerabilityDetection(true)]);

    await expect(checkVDIsEnabledCluster()).resolves.toBe(true);
  });

  it('keeps reading the legacy yes/no dialect', async () => {
    mockNodes('node01');
    mockWmodules([vulnerabilityDetection('yes')]);

    await expect(checkVDIsEnabledCluster()).resolves.toBe(true);
  });

  it('reports the module as not enabled in either dialect', async () => {
    mockNodes('node01');
    mockWmodules([vulnerabilityDetection(false)]);
    await expect(checkVDIsEnabledCluster()).resolves.toBe(false);

    mockNodes('node01');
    mockWmodules([vulnerabilityDetection('no')]);
    await expect(checkVDIsEnabledCluster()).resolves.toBe(false);
  });

  it('reports the module as not enabled when no node configures it', async () => {
    mockNodes('node01');
    mockWmodules([{ 'task-manager': {} }]);

    await expect(checkVDIsEnabledCluster()).resolves.toBe(false);
  });

  it('is enabled when any node of the cluster has it enabled', async () => {
    mockNodes('node01', 'node02');
    mockWmodules(
      [vulnerabilityDetection(false)],
      [vulnerabilityDetection(true)],
    );

    await expect(checkVDIsEnabledCluster()).resolves.toBe(true);
  });

  it('stops asking the remaining nodes once one reports it enabled', async () => {
    mockNodes('node01', 'node02');
    mockWmodules(
      [vulnerabilityDetection(true)],
      [vulnerabilityDetection(true)],
    );

    await checkVDIsEnabledCluster();

    expect(WzRequest.apiReq).toHaveBeenCalledTimes(1);
  });
});
