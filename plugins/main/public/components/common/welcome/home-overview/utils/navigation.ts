import rison from 'rison-node';
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
  tFilter,
} from '../../../data-source';
import {
  FINDING_SEVERITY_FIELD,
  HOST_OS_NAME_FIELD,
  SCA_CHECK_RESULT_FIELD,
  VULNERABILITY_SEVERITY_FIELD,
  VULNERABILITY_SEVERITY_VALUES,
} from '../lib/fields';
import { SeverityBand, TopItem } from '../interfaces/types';

/** Shared `_g` query state: last 24h, no pinned filters, refresh paused. */
const DISCOVER_G_STATE =
  '(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))';

/** Navigation helpers, kept in one module so sections depend on one boundary. */

const getUrlForApp = (appId: string, options?: Record<string, unknown>) =>
  NavigationService.getInstance().getUrlForApp(appId, options);

const navigate = (appId: string, options?: Record<string, unknown>) =>
  NavigationService.getInstance().navigateToApp(appId, options);

export const getAgentsUrl = () => getUrlForApp(endpointSummary.id);

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

export const getThreatHuntingUrl = () => getUrlForApp(threatHunting.id);

/**
 * Open Discover filtered to a findings severity band. `IS` on `wazuh.rule.level`
 */
export const getDiscoverFindingsBySeverityUrl = (
  band: SeverityBand,
  indexPatternId?: string,
  fixedFilters: tFilter[] = [],
): string => {
  if (!indexPatternId) {
    return getUrlForApp(threatHunting.id);
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
  return getUrlForApp(threatHunting.id, {
    path: `#overview/?tab=general&tabView=findings&_a=${queryState}&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))`,
  });
};
export const getMitreUrl = () => getUrlForApp(mitreAttack.id);

export const getMitreIntelligenceResourceUrl = (
  resource: 'tactics' | 'techniques',
  item: TopItem,
): string =>
  getUrlForApp(mitreAttack.id, {
    path: `#/overview?tab=mitre&tabView=intelligence&tabRedirect=${resource}&nameToRedirect=${encodeURIComponent(
      item.key,
    )}`,
  });
export const getItHygieneUrl = () => getUrlForApp(ITHygiene.id);

/** IT Hygiene > System > OS tab, optionally filtered to one `host.os.name`. */
export const getItHygieneSystemOsUrl = (
  osName?: string,
  indexPatternId?: string,
): string => {
  const path = '#overview/?tab=it-hygiene&tabView=system&tabSubView=os';
  if (!osName || !indexPatternId) {
    return getUrlForApp(ITHygiene.id, { path });
  }
  const queryState = rison.encode({
    filters: [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        HOST_OS_NAME_FIELD,
        osName,
        indexPatternId,
      ),
    ],
    query: { language: 'kuery', query: '' },
  });
  return getUrlForApp(ITHygiene.id, {
    path: `${path}&_a=${queryState}&_g=${DISCOVER_G_STATE}`,
  });
};
export const getItHygieneSoftwareUrl = () =>
  getUrlForApp(ITHygiene.id, {
    path: '#overview/?tab=it-hygiene&tabView=software&tabSubView=packages',
  });
export const getItHygieneUsersTabUrl = () =>
  getUrlForApp(ITHygiene.id, {
    path: '#overview/?tab=it-hygiene&tabView=users&tabSubView=users',
  });
export const getItHygieneServicesTabUrl = () =>
  getUrlForApp(ITHygiene.id, {
    path: '#overview/?tab=it-hygiene&tabView=services',
  });

export const getConfigurationAssessmentUrl = () =>
  getUrlForApp(configurationAssessment.id);

/** Configuration Assessment > Inventory, filtered to a `check.result` value. */
export const getConfigurationAssessmentByStatusUrl = (
  status: string,
  indexPatternId?: string,
): string => {
  if (!indexPatternId) {
    return getUrlForApp(configurationAssessment.id);
  }
  const queryState = rison.encode({
    filters: [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        SCA_CHECK_RESULT_FIELD,
        status,
        indexPatternId,
      ),
    ],
    query: { language: 'kuery', query: '' },
  });
  return getUrlForApp(configurationAssessment.id, {
    path: `#overview/?tab=sca&tabView=inventory&_a=${queryState}&_g=${DISCOVER_G_STATE}`,
  });
};

export const getFileIntegrityMonitoringUrl = () =>
  getUrlForApp(fileIntegrityMonitoring.id);
export const getFileIntegrityMonitoringInventoryFilesUrl = () =>
  getUrlForApp(fileIntegrityMonitoring.id, {
    path: '#overview/?tab=fim&tabView=inventory&tabSubView=files',
  });

export const getMalwareDetectionUrl = () => getUrlForApp(malwareDetection.id);
export const getVulnerabilityDetectionUrl = () =>
  getUrlForApp(vulnerabilityDetection.id);

/** Vulnerability Detection > Inventory, filtered by severity band. */
export const getVulnerabilityDetectionBySeverityUrl = (
  band: SeverityBand,
  indexPatternId?: string,
): string => {
  if (!indexPatternId) {
    return getUrlForApp(vulnerabilityDetection.id);
  }
  const queryState = rison.encode({
    filters: [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        VULNERABILITY_SEVERITY_FIELD,
        VULNERABILITY_SEVERITY_VALUES[band],
        indexPatternId,
      ),
    ],
    query: { language: 'kuery', query: '' },
  });
  return getUrlForApp(vulnerabilityDetection.id, {
    path: `#overview/?tab=vuls&tabView=inventory&_a=${queryState}&_g=${DISCOVER_G_STATE}`,
  });
};

export const getActiveResponseUrl = () => getUrlForApp(activeResponses.id);
/** Incident Response > Responses tab (triggered actions list). */
export const getActiveResponseResponsesUrl = () =>
  getUrlForApp(activeResponses.id, {
    path: '#overview/?tab=incident-response-dashboard&tabView=responses',
  });

export const getRegulatoryComplianceUrlHome = () =>
  getUrlForApp(regulatoryCompliance.id);

export const getRegulatoryComplianceUrl = (tabView: string): string =>
  getUrlForApp(regulatoryCompliance.id, {
    path: `#/overview?tab=regulatory-compliance&tabView=${tabView}&tabSubView=controls`,
  });

/** Open a module by app id (list-driven, unlike the fixed links above). */
export const getModuleUrl = (appId: string): string => getUrlForApp(appId);

/**
 * App ids registered by the Security Analytics dashboards plugin. Absent when
 * it isn't installed, but by then the tile is already hidden via its 404.
 */
const SECURITY_ANALYTICS_APP_IDS = {
  rules: 'rules',
  decoders: 'decoders',
  integrations: 'sa-integrations',
  detectors: 'detectors',
  kvdbs: 'kvdbs',
};

/**
 * The AI Assistant app id, owned by the separate `wazuh-ai-assistant` plugin's
 * `common/constants.ts` (`PLUGIN_ID`). Kept as a literal here rather than imported: a cross-plugin
 * VALUE import does not resolve in this plugin's own build/test tree (a sibling plugin's source is
 * not present there) — the same constraint documented in
 * `plugins/wazuh-ai-assistant/common/nav-categories.ts`'s doc comment, which is why that plugin
 * also duplicates the `Home` category literal it joins rather than importing it from here.
 */
const AI_ASSISTANT_APP_ID = 'wazuhAiAssistant';

/** Opens the AI Assistant app from its Home overview shortcut (see the popover title in
 * `../components/quick-access/quick-access-menu.tsx`). */
export const getAiAssistantUrl = () => getUrlForApp(AI_ASSISTANT_APP_ID);

export const getRulesUrl = () => getUrlForApp(SECURITY_ANALYTICS_APP_IDS.rules);
export const getDecodersUrl = () =>
  getUrlForApp(SECURITY_ANALYTICS_APP_IDS.decoders);
export const getIntegrationsUrl = () =>
  getUrlForApp(SECURITY_ANALYTICS_APP_IDS.integrations);
export const getDetectorsUrl = () =>
  getUrlForApp(SECURITY_ANALYTICS_APP_IDS.detectors);
export const getKvdbsUrl = () => getUrlForApp(SECURITY_ANALYTICS_APP_IDS.kvdbs);
/**
 * Filters has no dedicated app id — it's a sub-route of the Integrations
 * (Overview) app, e.g. `sa-integrations#/filters`.
 */
export const getFiltersUrl = () =>
  getUrlForApp(SECURITY_ANALYTICS_APP_IDS.integrations, { path: '#/filters' });
