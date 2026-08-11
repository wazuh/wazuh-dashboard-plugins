import {
  getAiAssistantUrl,
  getMitreIntelligenceResourceUrl,
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
  PatternDataSourceFilterManager: { createFilter: jest.fn() },
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

describe('getAiAssistantUrl', () => {
  it('links to the wazuh-ai-assistant plugin app id (its PLUGIN_ID, kept as a literal here -- see the doc comment above getAiAssistantUrl for why it is not imported cross-plugin)', () => {
    expect(getAiAssistantUrl()).toBe('/app/wazuhAiAssistant');
  });
});
