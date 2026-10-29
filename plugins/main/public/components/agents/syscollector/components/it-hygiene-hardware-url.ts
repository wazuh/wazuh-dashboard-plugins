import NavigationService from '../../../../react-services/navigation-service';
import store from '../../../../redux/store';
import { ITHygiene } from '../../../../utils/applications';

/** IT Hygiene > System > Hardware tab, for the agent currently selected. */
export const getItHygieneHardwareUrl = (): string => {
  const agentId = store.getState()?.appStateReducers?.currentAgentData?.id;
  const path = `#/overview/?tab=it-hygiene&tabView=system&tabSubView=hardware${
    agentId ? `&agentId=${agentId}` : ''
  }`;

  return NavigationService.getInstance().getUrlForApp(ITHygiene.id, { path });
};
