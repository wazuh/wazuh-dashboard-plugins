import rison from 'rison-node';
import {
  getRulesetPageUrl,
  getThreatHuntingIocUrl,
  getVulnerabilityDetectionCveUrl,
} from './navigation';

jest.mock('../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getUrlForApp: (appId: string, options?: { path?: string }) =>
        `/app/${appId}${options?.path ?? ''}`,
    }),
  },
}));
jest.mock('../../common/data-source', () => ({
  FILTER_OPERATOR: { IS: 'is' },
  PatternDataSourceFilterManager: {
    createFilter: (
      _type: string,
      key: string,
      value: string,
      indexPatternId: string,
    ) => ({ meta: { key, params: { query: value }, index: indexPatternId } }),
  },
}));

/** The `_a` app state of a module URL, decoded. */
const appStateOf = (url: string) =>
  rison.decode(decodeURIComponent(/_a=(.*?)&_g=/.exec(url)?.[1] ?? '')) as {
    filters: Array<{
      meta: { key: string; params: { query: string }; index: string };
    }>;
  };

describe('CTI Explorer navigation', () => {
  it('hunts the findings that matched one IOC value, over the last 7 days', () => {
    const url = getThreatHuntingIocUrl('192.0.2.100:31337');

    expect(url).toMatch(
      /^\/app\/threat-hunting#overview\/\?tab=general&tabView=findings&_a=/,
    );
    expect(url).toContain('time:(from:now-7d,to:now)');
    expect(appStateOf(url).filters[0].meta).toEqual({
      key: 'wazuh.threat.enrichments.indicator.name',
      params: { query: '192.0.2.100:31337' },
      index: 'wazuh-findings-v5*',
    });
  });

  it('opens the Vulnerability Detection inventory on one CVE', () => {
    const url = getVulnerabilityDetectionCveUrl('CVE-2024-6387');

    expect(url).toMatch(
      /^\/app\/vulnerability-detection#overview\/\?tab=vuls&tabView=inventory&_a=/,
    );
    expect(appStateOf(url).filters[0].meta).toEqual({
      key: 'vulnerability.id',
      params: { query: 'CVE-2024-6387' },
      index: 'wazuh-states-vulnerabilities*',
    });
  });

  it('opens Ruleset Management with the links of the Home page', () => {
    expect(getRulesetPageUrl('rules')).toBe('/app/rules');
    expect(getRulesetPageUrl('decoders')).toBe('/app/decoders');
    expect(getRulesetPageUrl('integrations')).toBe('/app/sa-integrations');
    expect(getRulesetPageUrl('kvdbs')).toBe('/app/kvdbs');
  });
});
