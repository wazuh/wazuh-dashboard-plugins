import _ from 'lodash';
import store from '../../redux/store';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT } from '../../../common/constants';
import { WzRequest } from '../../react-services';
import NavigationService from '../../react-services/navigation-service';

/**
 * Options for the syncPinnedAgentSources method
 * @param forceUpdate - Force the update of the pinned agent with a Wazuh API request
 */
type TsyncPinnedAgentSourcesOptions = {
  forceUpdate?: boolean;
};

type TAgentItem = { id: string };

export class PinnedAgentManager {
  public static NO_AGENT_DATA = {};
  public static AGENT_ID_VIEW_KEY = 'agent';
  public static AGENT_ID_URL_VIEW_KEY = 'agentId';
  public static AGENT_ID_KEY = 'wazuh.agent.id';
  public static FILTER_CONTROLLED_PINNED_AGENT_KEY =
    DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
  private AGENT_VIEW_URL = '/agents';
  private store: any;
  private navigationService: NavigationService;

  constructor(inputStore?: any) {
    this.store = inputStore ?? store;
    this.navigationService = NavigationService.getInstance();
  }

  private equalToPinnedAgent(agentData: any): boolean {
    const pinnedAgent = this.getPinnedAgent();
    return _.isEqual(pinnedAgent, agentData);
  }

  private checkValidAgentId(agentId: string | null): boolean {
    if (!agentId) {
      return false;
    }
    const regex = /^[0-9]+$/;
    return regex.test(agentId);
  }

  pinAgent(agentData: any): void {
    if (!agentData?.id) {
      this.unPinAgent();
      return;
    }
    const isPinnedAgent = this.isPinnedAgent();
    if (isPinnedAgent && this.equalToPinnedAgent(agentData)) {
      return;
    }
    this.store.dispatch(updateCurrentAgentData(agentData));
    const includesAgentViewURL = this.navigationService
      .getPathname()
      .includes(this.AGENT_VIEW_URL);
    const params = this.navigationService.getParams();

    params.set(
      includesAgentViewURL
        ? PinnedAgentManager.AGENT_ID_VIEW_KEY
        : PinnedAgentManager.AGENT_ID_URL_VIEW_KEY,
      String(agentData?.id),
    );
    this.navigationService.renewURL(params);
  }

  unPinAgent(): void {
    this.store.dispatch(
      updateCurrentAgentData(PinnedAgentManager.NO_AGENT_DATA),
    );
    const params = this.navigationService.getParams();
    ['agent', 'agentId'].forEach(param => {
      if (params.has(param)) {
        params.delete(param);
      }
    });
    this.navigationService.renewURL(params);
  }

  /**
   * Unpin the pinned agent when its ID is in the list (e.g. the agents were removed)
   * @param agentIds - IDs of the agents
   */
  unPinAgentIfPinned(agentIds: string[]): void {
    const pinnedAgentId = this.getPinnedAgent()?.id;
    if (pinnedAgentId && agentIds.includes(pinnedAgentId)) {
      this.unPinAgent();
    }
  }

  isPinnedAgent(): boolean {
    return !!this.store.getState().appStateReducers?.currentAgentData?.id;
  }

  async syncPinnedAgentSources(options?: TsyncPinnedAgentSourcesOptions) {
    const locationHref = window.location.href;
    const keyToMatch: string = locationHref.includes(this.AGENT_VIEW_URL)
      ? PinnedAgentManager.AGENT_ID_VIEW_KEY
      : PinnedAgentManager.AGENT_ID_URL_VIEW_KEY;
    const regex = new RegExp('[?&]' + keyToMatch + '[^&]*');
    const pinnedAgentByUrl = locationHref.match(regex);
    const agentIdValueUrl = pinnedAgentByUrl
      ? pinnedAgentByUrl[0].split('=')[1]
      : null;
    const isValidAgentId = this.checkValidAgentId(agentIdValueUrl);
    const pinnedAgentByStore = this.isPinnedAgent();
    if (pinnedAgentByUrl && !isValidAgentId) {
      this.unPinAgent();
    } else {
      const mustBeSynchronized =
        !pinnedAgentByUrl === pinnedAgentByStore ||
        (pinnedAgentByUrl &&
          pinnedAgentByStore &&
          agentIdValueUrl !== this.getPinnedAgent().id) ||
        options?.forceUpdate;
      if (mustBeSynchronized) {
        try {
          if (isValidAgentId) {
            const agents = await this.fetchAgents({
              q: 'id=' + agentIdValueUrl,
            });
            const agent = agents?.[0];
            if (agent) {
              this.pinAgent(agent);
            } else {
              this.unPinAgent();
            }
          } else {
            this.unPinAgent();
          }
        } catch (_error) {
          this.unPinAgent();
        }
      } else if (pinnedAgentByStore) {
        await this.unPinAgentIfRemoved(this.getPinnedAgent().id);
      }
    }
  }

  private async fetchAgents(params: {
    q: string;
    select?: string;
  }): Promise<TAgentItem[] | undefined> {
    const response = await WzRequest.apiReq('GET', '/agents', { params });
    return response?.data?.data?.affected_items;
  }

  /**
   * Unpin the pinned agent when the Wazuh API confirms it no longer exists.
   * The pin is kept when the request fails (e.g. transient or permission errors)
   * and the result is ignored when the pinned agent changed during the request.
   * @param agentId - ID of the pinned agent
   */
  private async unPinAgentIfRemoved(agentId: string) {
    let agents: TAgentItem[] | undefined;
    try {
      agents = await this.fetchAgents({ q: 'id=' + agentId, select: 'id' });
    } catch {
      return;
    }
    const agentWasRemoved = Array.isArray(agents) && agents.length === 0;
    if (agentWasRemoved && this.getPinnedAgent()?.id === agentId) {
      this.unPinAgent();
    }
  }

  getPinnedAgent(): any {
    return this.store.getState().appStateReducers?.currentAgentData;
  }
}
