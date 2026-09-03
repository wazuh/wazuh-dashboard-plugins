import rison from 'rison-node';
import {
  getAiAssistantUrl,
  getMitreFindingsByTechniqueUrl,
  getMitreIntelligenceResourceUrl,
  getMitreFrameworkTacticUrl,
  getVulnerabilityDetectionBySeverityUrl,
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
  FILTER_OPERATOR: { IS: 'is' },
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
    regulatoryCompliance: app('regulatory-compliance'),
    endpointSummary: app('endpoint-summary'),
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
