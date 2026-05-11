import { WazuhHostsCtrl } from './wazuh-hosts';
import * as ccsDetector from '../lib/ccs-detector';

jest.mock('../lib/ccs-detector');

const mockDetectCCS = ccsDetector.detectCCS as jest.MockedFunction<
  typeof ccsDetector.detectCCS
>;

const makeContext = (hosts: { id: string }[]) =>
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
