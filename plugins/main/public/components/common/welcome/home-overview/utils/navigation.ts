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
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../data-source/pattern/pattern-data-source-filter-manager';
import { MITRE_TACTIC_NAME_FIELD, MITRE_TECHNIQUE_NAME_FIELD } from '../lib/fields';

/** Navigation helpers, kept in one module so sections depend on one boundary. */

const navigate = (appId: string, options?: Record<string, unknown>) =>
  NavigationService.getInstance().navigateToApp(appId, options);

export const goToAgents = () => navigate(endpointSummary.id);

/** URL for the deploy-agent wizard (WzButtonPermissions needs an href). */
export const getDeployAgentUrl = (): string =>
  NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
    path: `#${endpointSummary.redirectTo()}deploy`,
  });

export const goToThreatHunting = () => navigate(threatHunting.id);
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

export const goToRegulatoryCompliance = (tabView: string): void =>
  navigate(regulatoryCompliance.id, {
    path: `#/overview?tab=regulatory-compliance&tabView=${tabView}&tabSubView=dashboard`,
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
 * Open MITRE ATT&CK filtered to the given field/value; falls back to
 * unfiltered when the findings index pattern isn't known yet.
 */
const goToMitreFilteredBy = (
  field: string,
  value: string,
  indexPatternId?: string,
): void => {
  if (!indexPatternId) {
    navigate(mitreAttack.id);
    return;
  }
  const filters = [
    PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      field,
      value,
      indexPatternId,
    ),
  ];
  const params = `tab=mitre&tabView=dashboard&_g=${PatternDataSourceFilterManager.filtersToURLFormat(
    filters,
  )}`;
  navigate(mitreAttack.id, { path: `#/overview?${params}` });
};

export const goToMitreTactic = (
  tacticName: string,
  indexPatternId?: string,
): void => goToMitreFilteredBy(MITRE_TACTIC_NAME_FIELD, tacticName, indexPatternId);

export const goToMitreTechnique = (
  techniqueName: string,
  indexPatternId?: string,
): void =>
  goToMitreFilteredBy(MITRE_TECHNIQUE_NAME_FIELD, techniqueName, indexPatternId);
