/* eslint-disable camelcase -- the manager API responses are snake_case */
import { PinnedAgentManager } from './wz-agent-selector-service';
import { WzRequest } from '../../react-services';

jest.mock('../../react-services', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

jest.mock('../../redux/store', () => ({
  __esModule: true,
  default: { getState: jest.fn(), dispatch: jest.fn() },
}));

const mockRenewURL = jest.fn();

jest.mock('../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getPathname: () => '/overview',
      getParams: () => new URLSearchParams(globalThis.location.search),
      renewURL: mockRenewURL,
    }),
  },
}));

const mockApiReq = WzRequest.apiReq as jest.Mock;

const UNPIN_ACTION = {
  type: 'UPDATE_SELECTED_AGENT_DATA',
  currentAgentData: PinnedAgentManager.NO_AGENT_DATA,
};

const createStore = (currentAgentData: object) => {
  let state = { appStateReducers: { currentAgentData } };
  return {
    getState: () => state,
    setPinnedAgent: (agentData: object) => {
      state = { appStateReducers: { currentAgentData: agentData } };
    },
    dispatch: jest.fn((action: { currentAgentData: object }) => {
      state = {
        appStateReducers: { currentAgentData: action.currentAgentData },
      };
    }),
  };
};

const setUrl = (search: string) => {
  window.history.replaceState({}, '', `/app/fim${search}`);
};

const agentsResponse = (affectedItems: object[]) => ({
  data: { data: { affected_items: affectedItems } },
});

describe('PinnedAgentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUrl('');
  });

  describe('syncPinnedAgentSources when the URL and the store agree', () => {
    beforeEach(() => {
      setUrl('?agentId=001');
    });

    it('keeps the pin without re-pinning when the agent still exists', async () => {
      const store = createStore({ id: '001', name: 'agent1' });
      mockApiReq.mockResolvedValue(agentsResponse([{ id: '001' }]));

      await new PinnedAgentManager(store).syncPinnedAgentSources();

      expect(mockApiReq).toHaveBeenCalledWith('GET', '/agents', {
        params: { q: 'id=001', select: 'id' },
      });
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(mockRenewURL).not.toHaveBeenCalled();
    });

    it('unpins the agent when it no longer exists', async () => {
      const store = createStore({ id: '001', name: 'agent1' });
      mockApiReq.mockResolvedValue(agentsResponse([]));

      await new PinnedAgentManager(store).syncPinnedAgentSources();

      expect(store.dispatch).toHaveBeenCalledWith(UNPIN_ACTION);
      const params: URLSearchParams = mockRenewURL.mock.calls[0][0];
      expect(params.has('agentId')).toBe(false);
    });

    it('keeps the pin when the verification request fails', async () => {
      const store = createStore({ id: '001', name: 'agent1' });
      mockApiReq.mockRejectedValue(new Error('Request failed'));

      await new PinnedAgentManager(store).syncPinnedAgentSources();

      expect(mockApiReq).toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(store.getState().appStateReducers.currentAgentData).toEqual({
        id: '001',
        name: 'agent1',
      });
    });

    it('ignores the result when the pinned agent changes during the request', async () => {
      const store = createStore({ id: '001', name: 'agent1' });
      let resolveRequest: (value: unknown) => void = () => {};
      mockApiReq.mockReturnValue(
        new Promise(resolve => {
          resolveRequest = resolve;
        }),
      );

      const sync = new PinnedAgentManager(store).syncPinnedAgentSources();
      store.setPinnedAgent({ id: '002', name: 'agent2' });
      resolveRequest(agentsResponse([]));
      await sync;

      expect(mockApiReq).toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(store.getState().appStateReducers.currentAgentData).toEqual({
        id: '002',
        name: 'agent2',
      });
    });
  });

  describe('syncPinnedAgentSources when the URL and the store disagree', () => {
    it('unpins the agent when the URL agent does not exist', async () => {
      setUrl('?agentId=002');
      const store = createStore({ id: '001', name: 'agent1' });
      mockApiReq.mockResolvedValue(agentsResponse([]));

      await new PinnedAgentManager(store).syncPinnedAgentSources();

      expect(store.dispatch).toHaveBeenCalledTimes(1);
      expect(store.dispatch).toHaveBeenCalledWith(UNPIN_ACTION);
      const params: URLSearchParams = mockRenewURL.mock.calls[0][0];
      expect(params.has('agentId')).toBe(false);
    });

    it('pins the URL agent when it exists', async () => {
      setUrl('?agentId=002');
      const store = createStore({ id: '001', name: 'agent1' });
      const agent = { id: '002', name: 'agent2' };
      mockApiReq.mockResolvedValue(agentsResponse([agent]));

      await new PinnedAgentManager(store).syncPinnedAgentSources();

      expect(mockApiReq).toHaveBeenCalledWith('GET', '/agents', {
        params: { q: 'id=002' },
      });
      expect(store.getState().appStateReducers.currentAgentData).toEqual(agent);
    });
  });

  describe('pinAgent', () => {
    it('unpins instead of pinning missing agent data', () => {
      setUrl('?agentId=001');
      const store = createStore({ id: '001', name: 'agent1' });

      new PinnedAgentManager(store).pinAgent(undefined);

      expect(store.dispatch).toHaveBeenCalledWith(UNPIN_ACTION);
      const params: URLSearchParams = mockRenewURL.mock.calls[0][0];
      expect(params.has('agentId')).toBe(false);
    });
  });

  describe('unPinAgentIfPinned', () => {
    it('unpins the agent when its id is in the list', () => {
      const store = createStore({ id: '001', name: 'agent1' });

      new PinnedAgentManager(store).unPinAgentIfPinned(['003', '001']);

      expect(store.dispatch).toHaveBeenCalledWith(UNPIN_ACTION);
    });

    it('keeps the pin when its id is not in the list', () => {
      const store = createStore({ id: '001', name: 'agent1' });

      new PinnedAgentManager(store).unPinAgentIfPinned(['002']);

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('does nothing when no agent is pinned', () => {
      const store = createStore({});

      new PinnedAgentManager(store).unPinAgentIfPinned(['001']);

      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });
});
