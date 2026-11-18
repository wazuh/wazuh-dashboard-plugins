import NavigationService from '../../../../../../../../../react-services/navigation-service';

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
  NavigationService.getInstance().updateAndNavigateSearchParams({
    tab: 'mitre',
    tabView: 'intelligence',
    tabRedirect: resource,
    idToRedirect: externalId,
  });
};
