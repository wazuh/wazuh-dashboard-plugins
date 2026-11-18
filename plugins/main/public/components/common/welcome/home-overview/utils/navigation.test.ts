import rison from 'rison-node';
import {
  getActiveResponseResponsesUrl,
  getCaseManagementCasesUrl,
  getAiAssistantUrl,
  getCreateActiveResponseUrl,
  getCtiExplorerIocsUrl,
  isActiveResponsesRegistered,
  getMitreFindingsByTechniqueUrl,
  getMitreIntelligenceResourceUrl,
  getMitreFrameworkTacticUrl,
  getVulnerabilityDetectionBySeverityUrl,
  isAiAssistantRegistered,
} from './navigation';

jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getUrlForApp: (appId: string, options?: { path?: string }) =>
        `/app/${appId}${options?.path ?? ''}`,
    }),
  },
}));
jest.mock('../../../data-source', () => ({
  FILTER_OPERATOR: { IS: 'is', IS_ONE_OF: 'is one of' },
  PatternDataSourceFilterManager: {
    createFilter: jest.fn(
      (
        type: string,
        key: string,
        value: string,
        indexPatternId: string,
        controlledBy?: string,
      ) => ({
        meta: {
          alias: null,
          disabled: false,
          key,
          value,
          params: value,
          negate: false,
          type: 'phrase',
          index: indexPatternId,
          controlledBy,
        },
        query: { ['match_phrase']: { [key]: { query: value } } },
        type,
        $state: { store: 'appState' },
      }),
    ),
  },
}));
// applications.ts pulls the redux store; only the app ids are needed here
jest.mock('../../../../../utils/applications', () => {
  const app = (id: string) => ({ id, redirectTo: () => '' });
  return {
    threatHunting: app('threat-hunting'),
    mitreAttack: app('mitre-attack'),
    ITHygiene: app('it-hygiene'),
    configurationAssessment: app('configuration-assessment'),
    fileIntegrityMonitoring: app('file-integrity-monitoring'),
    malwareDetection: app('malware-detection'),
    vulnerabilityDetection: app('vulnerability-detection'),
    activeResponses: app('incident-response-dashboard'),
    caseManagement: app('case-management'),
    regulatoryCompliance: app('regulatory-compliance'),
    endpointSummary: app('endpoint-summary'),
    ctiExplorer: app('cti-explorer'),
  };
});

describe('getMitreIntelligenceResourceUrl', () => {
  it('links by encoded name even when the item carries an id (unreliable from multi-valued docs)', () => {
    expect(
      getMitreIntelligenceResourceUrl('techniques', {
        key: 'Exploit Public-Facing Application',
        count: 1,
        id: 'T1190',
      }),
    ).toBe(
      '/app/mitre-attack#/overview?tab=mitre&tabView=intelligence&tabRedirect=techniques&nameToRedirect=Exploit%20Public-Facing%20Application',
    );
  });

  it('links by encoded name when the item has no id', () => {
    expect(
      getMitreIntelligenceResourceUrl('tactics', {
        key: 'Initial Access',
        count: 1,
      }),
    ).toBe(
      '/app/mitre-attack#/overview?tab=mitre&tabView=intelligence&tabRedirect=tactics&nameToRedirect=Initial%20Access',
    );
  });
});

interface DecodedFilterAppState {
  filters: Array<{
    meta: {
      key: string;
      value: string;
      index: string;
      controlledBy?: string;
    };
  }>;
}

const decodeAppState = (url: string): DecodedFilterAppState | undefined => {
  const match = url.match(/_a=([^&]+)/);
  return match ? (rison.decode(match[1]) as DecodedFilterAppState) : undefined;
};

describe('getMitreFindingsByTechniqueUrl', () => {
  it('links to MITRE ATT&CK > Findings filtered by the technique name', () => {
    const url = getMitreFindingsByTechniqueUrl(
      { key: 'Exploit Public-Facing Application', count: 1, id: 'T1190' },
      'idx-1',
    );
    const appState = decodeAppState(url);

    expect(url).toContain('#overview/?tab=mitre&tabView=findings');
    expect(url).toContain('&_g=');
    expect(appState?.filters).toHaveLength(1);
    expect(appState?.filters[0].meta.key).toBe(
      'wazuh.rule.mitre.technique.name',
    );
    expect(appState?.filters[0].meta.value).toBe(
      'Exploit Public-Facing Application',
    );
    expect(appState?.filters[0].meta.index).toBe('idx-1');
    expect(url).not.toContain('T1190');
  });

  it('falls back to the plain MITRE ATT&CK app url without an index pattern', () => {
    expect(
      getMitreFindingsByTechniqueUrl({
        key: 'Exploit Public-Facing Application',
        count: 1,
      }),
    ).toBe('/app/mitre-attack');
  });
});

describe('getMitreFrameworkTacticUrl', () => {
  it('routes to the Framework tab on the hash shape that applies `_a`', () => {
    // `tabView=inventory` is the Framework tab's id, and only the `#overview/?`
    // shape is consumed by the app-state sync. `#/overview?` navigates but
    // silently drops the filter, so the route is pinned to a sibling helper
    // that already carries `_a`.
    const url = getMitreFrameworkTacticUrl(
      { key: 'Impact', count: 1 },
      'idx-1',
    );
    const hashRoute = (value: string) => value.split('?')[0].split('#')[1];

    expect(url).toContain('#overview/?tab=mitre&tabView=inventory');
    expect(url).not.toContain('tabView=framework');
    expect(hashRoute(url)).toBe(
      hashRoute(getVulnerabilityDetectionBySeverityUrl('critical', 'idx-1')),
    );
  });

  it('encodes one IS filter on wazuh.rule.mitre.tactic.name with value item.key', () => {
    const url = getMitreFrameworkTacticUrl(
      { key: 'Initial Access', count: 1 },
      'idx-1',
    );
    const appState = decodeAppState(url);
    expect(appState?.filters).toHaveLength(1);
    expect(appState?.filters[0].meta.key).toBe('wazuh.rule.mitre.tactic.name');
    expect(appState?.filters[0].meta.value).toBe('Initial Access');
  });

  it('omits meta.controlledBy so the filter pill stays user-removable', () => {
    const url = getMitreFrameworkTacticUrl(
      { key: 'Initial Access', count: 1 },
      'idx-1',
    );
    const appState = decodeAppState(url);
    expect(appState?.filters[0].meta.controlledBy).toBeUndefined();
  });

  it('stamps meta.index with the passed indexPatternId', () => {
    const url = getMitreFrameworkTacticUrl(
      { key: 'Initial Access', count: 1 },
      'idx-1',
    );
    const appState = decodeAppState(url);
    expect(appState?.filters[0].meta.index).toBe('idx-1');
  });

  it('never reads item.id (keys on the tactic name only)', () => {
    const url = getMitreFrameworkTacticUrl(
      { key: 'Initial Access', count: 1, id: 'TA0006' },
      'idx-1',
    );
    expect(url).not.toContain('TA0006');
  });

  it('returns the bare Framework URL with no _a when indexPatternId is missing', () => {
    const url = getMitreFrameworkTacticUrl({ key: 'Initial Access', count: 1 });
    expect(url).toBe('/app/mitre-attack#overview/?tab=mitre&tabView=inventory');
    expect(url).not.toContain('_a=');
  });
});

describe('getAiAssistantUrl', () => {
  it('links to the wazuh-ai-assistant plugin app id (its PLUGIN_ID, kept as a literal here -- see the doc comment above getAiAssistantUrl for why it is not imported cross-plugin)', () => {
    expect(getAiAssistantUrl()).toBe('/app/wazuhAiAssistant');
  });
});

describe('isAiAssistantRegistered', () => {
  it('is true when OSD registered the wazuhAiAssistant app', () => {
    expect(isAiAssistantRegistered(new Map([['wazuhAiAssistant', {}]]))).toBe(
      true,
    );
  });

  it('is false when the plugin is disabled, so its app is not registered', () => {
    expect(isAiAssistantRegistered(new Map([['wz-home', {}]]))).toBe(false);
  });
});

describe('getCreateActiveResponseUrl', () => {
  it('opens the create form of the Active Responses app', () => {
    expect(getCreateActiveResponseUrl()).toBe(
      '/app/active-responses#/create-active-response',
    );
  });
});

describe('isActiveResponsesRegistered', () => {
  it('is true when the Active Responses app is registered', () => {
    expect(
      isActiveResponsesRegistered(new Map([['active-responses', {}]])),
    ).toBe(true);
  });

  it('is false when the plugin is not installed', () => {
    expect(isActiveResponsesRegistered(new Map([['wz-home', {}]]))).toBe(false);
  });
});

describe('getCtiExplorerIocsUrl', () => {
  it('opens the IOCs tab of the CTI Explorer', () => {
    expect(getCtiExplorerIocsUrl()).toBe(
      '/app/cti-explorer#/cti-explorer/?tab=iocs',
    );
  });

  it('filters the IOC list to one type', () => {
    expect(getCtiExplorerIocsUrl('hash_sha256')).toBe(
      '/app/cti-explorer#/cti-explorer/?tab=iocs&iocType=hash_sha256',
    );
  });
});

describe('getActiveResponseResponsesUrl', () => {
  it('opens the Responses tab', () => {
    expect(getActiveResponseResponsesUrl()).toBe(
      '/app/incident-response-dashboard#overview/?tab=incident-response-dashboard&tabView=responses',
    );
  });

  it('filters the Responses tab to one value, last 24 hours', () => {
    const url = getActiveResponseResponsesUrl(
      { field: 'wazuh.agent.name', value: 'linux-1' },
      'idx-ar',
    );
    expect(decodeAppState(url)?.filters[0].meta).toMatchObject({
      key: 'wazuh.agent.name',
      value: 'linux-1',
      index: 'idx-ar',
    });
    expect(url).toContain('time:(from:now-24h,to:now)');
  });
});

describe('getCaseManagementCasesUrl', () => {
  it('opens the Cases tab unfiltered without an index pattern', () => {
    expect(
      getCaseManagementCasesUrl([
        { field: 'wazuh.case.status', value: 'active' },
      ]),
    ).toBe('/app/case-management#overview/?tab=caseManagement&tabView=cases');
  });

  it('adds one filter per field, "is one of" for a list, over a range wide enough for every case', () => {
    const url = getCaseManagementCasesUrl(
      [
        { field: 'wazuh.case.status', value: ['active', 'acknowledged'] },
        { field: 'wazuh.case.severity', value: 'high' },
      ],
      'idx-findings',
    );
    const filters = decodeAppState(url)?.filters as unknown as Array<{
      meta: { key: string; value: unknown };
      type: string;
    }>;
    expect(
      filters.map(({ meta, type }) => [type, meta.key, meta.value]),
    ).toEqual([
      ['is one of', 'wazuh.case.status', ['active', 'acknowledged']],
      ['is', 'wazuh.case.severity', 'high'],
    ]);
    expect(url).toContain('time:(from:now-10y,to:now)');
  });
});
