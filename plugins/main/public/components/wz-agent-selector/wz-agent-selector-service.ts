import store from '../../redux/store';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';

export class PinnedAgentManager {
  public static NO_AGENT_DATA = {};
  private store: any;

  constructor(inputStore: any) {
    this.store = inputStore ?? store;
  }

  pinAgent(agentData: any): void {
    this.store.dispatch(updateCurrentAgentData(agentData));
  }

  unPinAgent(): void {
    this.store.dispatch(
      updateCurrentAgentData(PinnedAgentManager.NO_AGENT_DATA),
    );
  }

  isPinnedAgent(): boolean {
    return !!this.store.getState().appStateReducers?.currentAgentData?.id;
  }

  getPinnedAgent(): any {
    return this.store.getState().appStateReducers?.currentAgentData;
  }
}
