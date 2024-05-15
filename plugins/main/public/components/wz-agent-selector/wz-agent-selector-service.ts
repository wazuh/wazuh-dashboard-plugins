import store from '../../redux/store';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT } from '../../../common/constants';
import { getAngularModule } from '../../kibana-services';
import { WzRequest } from '../../react-services';

export class PinnedAgentManager {
  public static NO_AGENT_DATA = {};
  public static AGENT_ID_VIEW_KEY = 'agent';
  public static AGENT_ID_URL_VIEW_KEY = 'agentId';
  public static AGENT_ID_KEY = 'agent.id';
  public static FILTER_CONTROLLED_PINNED_AGENT_KEY =
    DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
  private AGENT_VIEW_URL = '/agents';
  private store: any;
  private location: any;
  private route: any;

  constructor(inputStore?: any) {
    this.store = inputStore ?? store;
    const $injector = getAngularModule().$injector;
    this.location = $injector.get('$location');
    this.route = $injector.get('$route');
  }

  private equalToPinnedAgent(agentData: any): boolean {
    const pinnedAgent = this.getPinnedAgent();
    return pinnedAgent?.id === agentData?.id;
  }

  private checkValidAgentId(agentId: string | null): boolean {
    if (!agentId) {
      return false;
    }
    const regex = /^[0-9]+$/;
    return regex.test(agentId);
  }

  pinAgent(agentData: any): void {
    const isPinnedAgent = this.isPinnedAgent();
    if (isPinnedAgent && this.equalToPinnedAgent(agentData)) {
      return;
    }
    this.store.dispatch(updateCurrentAgentData(agentData));
    this.location.search(
      window.location.href.includes(this.AGENT_VIEW_URL)
        ? PinnedAgentManager.AGENT_ID_VIEW_KEY
        : PinnedAgentManager.AGENT_ID_URL_VIEW_KEY,
      String(agentData?.id),
    );
    this.route.reload();
  }

  unPinAgent(): void {
    this.store.dispatch(
      updateCurrentAgentData(PinnedAgentManager.NO_AGENT_DATA),
    );
    ['agent', 'agentId'].forEach(param => {
      if (this.location.search()[param]) {
        setTimeout(() => {
          this.location.search(param, null);
          this.route.reload();
        }, 1);
      }
    });
  }

  isPinnedAgent(): boolean {
    return !!this.store.getState().appStateReducers?.currentAgentData?.id;
  }

  async syncPinnedAgentSources() {
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
      const mustBeSynchronized = !pinnedAgentByUrl === pinnedAgentByStore;
      if (mustBeSynchronized) {
        try {
          if (isValidAgentId) {
            const data = await WzRequest.apiReq('GET', '/agents', {
              params: { q: 'id=' + agentIdValueUrl },
            });
            const formattedData = data?.data?.data?.affected_items?.[0];
            this.pinAgent(formattedData);
          } else {
            this.unPinAgent();
          }
        } catch (_error) {
          this.unPinAgent();
        }
      }
    }
  }

  getPinnedAgent(): any {
    return this.store.getState().appStateReducers?.currentAgentData;
  }
}
