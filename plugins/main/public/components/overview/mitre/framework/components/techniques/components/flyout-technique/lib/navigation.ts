import NavigationService from '../../../../../../../../../react-services/navigation-service';
import { getWzCurrentAppID } from '../../../../../../../../../kibana-services';
import { mitreAttack } from '../../../../../../../../../utils/applications';

export type IntelligenceResource =
  | 'techniques'
  | 'tactics'
  | 'mitigations'
  | 'groups'
  | 'software';

/** Opens an item in MITRE ATT&CK > Intelligence. */
export const goToIntelligence = (
  resource: IntelligenceResource,
  externalId: string,
) => {
  const params = {
    tab: 'mitre',
    tabView: 'intelligence',
    tabRedirect: resource,
    idToRedirect: externalId,
  };
  // Outside MITRE ATT&CK (e.g. the agent overview) only switching apps opens Intelligence.
  if (getWzCurrentAppID() !== mitreAttack.id) {
    NavigationService.getInstance().navigateToApp(mitreAttack.id, {
      path: `#/overview?${new URLSearchParams(params).toString()}`,
    });
    return;
  }
  NavigationService.getInstance().updateAndNavigateSearchParams(params);
};
