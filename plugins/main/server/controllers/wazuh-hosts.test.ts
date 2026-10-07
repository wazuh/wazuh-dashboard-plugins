import { WazuhHostsCtrl } from './wazuh-hosts';
import * as ccsDetector from '../lib/ccs-detector';

jest.mock('../lib/ccs-detector');

const mockDetectCCS = ccsDetector.detectCCS as jest.MockedFunction<
  typeof ccsDetector.detectCCS
>;

const makeContext = (hosts: Record<string, unknown>[]) =>
  ({
    wazuh: { logger: { error: jest.fn() } },
    wazuh_core: {
      manageHosts: {
        getEntries: jest.fn().mockResolvedValue(hosts),
      },
    },
  } as any);

const makeResponse = () => ({
  ok: jest.fn(({ body }) => ({ body })),
});

describe('WazuhHostsCtrl', () => {
  const ctrl = new WazuhHostsCtrl();

  beforeEach(() => jest.clearAllMocks());

  describe('getHostsEntries', () => {
    it('returns all hosts when CCS is detected', async () => {
      mockDetectCCS.mockResolvedValue(true);
      const context = makeContext([{ id: 'manager' }, { id: 'cluster-b' }]);
      const response = makeResponse();

      await ctrl.getHostsEntries(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({
        body: [{ id: 'manager' }, { id: 'cluster-b' }],
      });
    });

    it('returns only the first host when CCS is not detected', async () => {
      mockDetectCCS.mockResolvedValue(false);
      const context = makeContext([{ id: 'manager' }, { id: 'cluster-b' }]);
      const response = makeResponse();

      await ctrl.getHostsEntries(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({
        body: [{ id: 'manager' }],
      });
    });

    it('returns only the host fields the UI reads', async () => {
      mockDetectCCS.mockResolvedValue(false);
      /* eslint-disable camelcase -- API host field names */
      const visible = {
        id: 'manager',
        url: 'https://manager',
        port: 55000,
        username: 'wazuh-wui',
        allow_run_as: 2,
        verify_ca: true,
        cluster_info: { node: 'node01', cluster: 'wazuh' },
      };
      const context = makeContext([
        {
          ...visible,
          password: 'secret',
          run_as: false,
          key: '/etc/wazuh/key.pem',
          cert: '/etc/wazuh/cert.pem',
          ca: '/etc/wazuh/ca.pem',
        },
      ]);
      /* eslint-enable camelcase */
      const response = makeResponse();

      await ctrl.getHostsEntries(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({ body: [visible] });
    });

    it('returns empty array when no hosts configured', async () => {
      const context = makeContext([]);
      const response = makeResponse();

      await ctrl.getHostsEntries(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({ body: [] });
      expect(mockDetectCCS).not.toHaveBeenCalled();
    });
  });

  describe('getCCSStatus', () => {
    it('returns isCCS true when CCS is detected', async () => {
      mockDetectCCS.mockResolvedValue(true);
      const context = makeContext([]);
      const response = makeResponse();

      await ctrl.getCCSStatus(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({ body: { isCCS: true } });
    });

    it('returns isCCS false when no CCS', async () => {
      mockDetectCCS.mockResolvedValue(false);
      const context = makeContext([]);
      const response = makeResponse();

      await ctrl.getCCSStatus(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({ body: { isCCS: false } });
    });

    it('returns isCCS false when detectCCS throws', async () => {
      mockDetectCCS.mockRejectedValue(new Error('fail'));
      const context = makeContext([]);
      const response = makeResponse();

      await ctrl.getCCSStatus(context, {} as any, response as any);

      expect(response.ok).toHaveBeenCalledWith({ body: { isCCS: false } });
    });
  });
});
