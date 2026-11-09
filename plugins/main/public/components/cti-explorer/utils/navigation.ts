import rison from 'rison-node';
import NavigationService from '../../../react-services/navigation-service';
import {
  threatHunting,
  vulnerabilityDetection,
} from '../../../utils/applications';
import {
  WAZUH_FINDINGS_PATTERN,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../../../../common/constants';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../common/data-source';
import {
  getDecodersUrl,
  getIntegrationsUrl,
  getKvdbsUrl,
  getRulesUrl,
} from '../../common/welcome/home-overview/utils/navigation';
import type { DetectionContentKey } from '../services/cti-explorer-api';

/** Findings field that holds the IOC value an event matched. */
export const IOC_MATCH_FIELD = 'wazuh.threat.enrichments.indicator.name';
const VULNERABILITY_ID_FIELD = 'vulnerability.id';

/** IOC matches are rare: hunting one value looks back further than a day. */
const HUNT_G_STATE =
  '(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-7d,to:now))';
/** Vulnerabilities are state: the time range does not apply to them. */
const STATE_G_STATE =
  '(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))';

const getUrlForApp = (appId: string, options?: { path?: string }) =>
  NavigationService.getInstance().getUrlForApp(appId, options);

/** The index pattern id of these data sources is the pattern itself. */
const buildQueryState = (
  field: string,
  value: string,
  indexPatternId: string,
) =>
  rison.encode({
    filters: [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        field,
        value,
        indexPatternId,
      ),
    ],
    query: { language: 'kuery', query: '' },
  });

/** Threat Hunting > Findings, filtered to the events that matched one IOC value. */
export const getThreatHuntingIocUrl = (value: string): string =>
  getUrlForApp(threatHunting.id, {
    path: `#overview/?tab=general&tabView=findings&_a=${buildQueryState(
      IOC_MATCH_FIELD,
      value,
      WAZUH_FINDINGS_PATTERN,
    )}&_g=${HUNT_G_STATE}`,
  });

/** Vulnerability Detection > Inventory, filtered to one CVE. */
export const getVulnerabilityDetectionCveUrl = (id: string): string =>
  getUrlForApp(vulnerabilityDetection.id, {
    path: `#overview/?tab=vuls&tabView=inventory&_a=${buildQueryState(
      VULNERABILITY_ID_FIELD,
      id,
      WAZUH_VULNERABILITIES_PATTERN,
    )}&_g=${STATE_G_STATE}`,
  });

/** Ruleset Management pages, opened with the links of the Home page. */
const RULESET_PAGE_URLS: Record<DetectionContentKey, () => string> = {
  rules: getRulesUrl,
  decoders: getDecodersUrl,
  integrations: getIntegrationsUrl,
  kvdbs: getKvdbsUrl,
};

export const getRulesetPageUrl = (key: DetectionContentKey): string =>
  RULESET_PAGE_URLS[key]();
