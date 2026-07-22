import NavigationService from '../../../../../react-services/navigation-service';
import {
  threatHunting,
  mitreAttack,
  ITHygiene,
  configurationAssessment,
  fileIntegrityMonitoring,
  malwareDetection,
  vulnerabilityDetection,
  activeResponses,
  regulatoryCompliance,
  endpointSummary,
} from '../../../../../utils/applications';
import rison from 'rison-node';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
  tFilter,
} from '../../../data-source';
import {
  FINDING_SEVERITY_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
} from '../lib/fields';
import { SeverityBand } from '../interfaces/types';

/** Navigation helpers, kept in one module so sections depend on one boundary. */

const navigate = (appId: string, options?: Record<string, unknown>) =>
  NavigationService.getInstance().getUrlForApp(appId, options);
// const getUrlForApp = (appId: string, options?: Record<string, unknown>) =>
//   NavigationService.getInstance().getUrlForApp(appId, options);

export const goToAgents = () => navigate(endpointSummary.id);

export const goToAgentsByStatus = (status: string): void => {
  sessionStorage.setItem(
    'wz-agents-overview-table-filter',
    JSON.stringify({ q: `status=${status}` }),
  );
  navigate(endpointSummary.id, { path: `#${endpointSummary.redirectTo()}` });
};

/** URL for the deploy-agent wizard (WzButtonPermissions needs an href). */
export const getDeployAgentUrl = (): string =>
  NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
    path: `#${endpointSummary.redirectTo()}deploy`,
  });

export const goToThreatHunting = () => navigate(threatHunting.id);

const DISCOVER_APP_ID = 'data-explorer';

/**
 * Open Discover filtered to a findings severity band. `IS` on `wazuh.rule.level`
 */
export const goToDiscoverFindingsBySeverity = (
  band: SeverityBand,
  indexPatternId?: string,
  fixedFilters: tFilter[] = [],
): string => {
  if (!indexPatternId) {
    return navigate(threatHunting.id);
  }
  const queryState = rison.encode({
    filters: [
      ...fixedFilters,
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        FINDING_SEVERITY_FIELD,
        band,
        indexPatternId,
      ),
    ],
    query: { language: 'kuery', query: '' },
  });
  return navigate(DISCOVER_APP_ID, {
    path: `discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'${indexPatternId}',view:discover))&_g=()&_q=${queryState}`,
  });
};
export const goToMitre = () => navigate(mitreAttack.id);
export const goToItHygiene = () => navigate(ITHygiene.id);
export const goToConfigurationAssessment = () =>
  navigate(configurationAssessment.id);
export const goToFileIntegrityMonitoring = () =>
  navigate(fileIntegrityMonitoring.id);
export const goToMalwareDetection = () => navigate(malwareDetection.id);
export const goToVulnerabilityDetection = () =>
  navigate(vulnerabilityDetection.id);
export const goToActiveResponse = () => navigate(activeResponses.id);

export const goToRegulatoryComplianceHome = () =>
  navigate(regulatoryCompliance.id);

export const goToRegulatoryCompliance = (tabView: string): void =>
  navigate(regulatoryCompliance.id, {
    path: `#/overview?tab=regulatory-compliance&tabView=${tabView}&tabSubView=controls`,
  });

/** Open a Cloud Security module by app id (list-driven, unlike the fixed links above). */
export const goToCloudModule = (appId: string): void => navigate(appId);

/**
 * App ids registered by the Security Analytics dashboards plugin. Absent when
 * it isn't installed, but by then the tile is already hidden via its 404.
 */
const SECURITY_ANALYTICS_APP_IDS = {
  rules: 'rules',
  decoders: 'decoders',
  integrations: 'sa-integrations',
  detectors: 'detectors',
};

export const goToRules = () => navigate(SECURITY_ANALYTICS_APP_IDS.rules);
export const goToDecoders = () => navigate(SECURITY_ANALYTICS_APP_IDS.decoders);
export const goToIntegrations = () =>
  navigate(SECURITY_ANALYTICS_APP_IDS.integrations);
export const goToDetectors = () =>
  navigate(SECURITY_ANALYTICS_APP_IDS.detectors);

/**
 * Open the MITRE ATT&CK Intelligence tab on a specific resource. Intelligence
 * resolves the resource by its external id (`resource.tsx` queries
 * `?q=external_id=<idToRedirect>`), so the id is required.
 * Falls back to the module home when the id isn't known.
 */
const goToMitreIntelligence = (
  tabRedirect: 'tactics' | 'techniques',
  externalId?: string,
): void => {
  if (!externalId) {
    navigate(mitreAttack.id);
    return;
  }
  const params = `tab=mitre&tabView=intelligence&tabRedirect=${tabRedirect}&idToRedirect=${externalId}`;
  navigate(mitreAttack.id, { path: `#/overview?${params}` });
};

/** Top-tactic labels deep-link into the Intelligence resource for that tactic. */
export const goToMitreTactic = (externalId?: string): void =>
  goToMitreIntelligence('tactics', externalId);

/**
 * Open the MITRE ATT&CK Framework tab filtered to a technique by name; falls
 * back to the module home when the findings index pattern isn't known yet. The
 * Framework tab (`tabView=inventory`) reads the `_g` global filter through the
 * same data-source/filter-manager the dashboard uses.
 */
export const goToMitreTechnique = (
  techniqueName?: string,
  indexPatternId?: string,
): void => {
  if (!techniqueName || !indexPatternId) {
    navigate(mitreAttack.id);
    return;
  }
  const filters = [
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      MITRE_TECHNIQUE_NAME_FIELD,
      techniqueName,
      indexPatternId,
    ),
  ];
  const params = `tab=mitre&tabView=inventory&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
    filters,
  )}`;
  navigate(mitreAttack.id, { path: `#/overview?${params}` });
};
