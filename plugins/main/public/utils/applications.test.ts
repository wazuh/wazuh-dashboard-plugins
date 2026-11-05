import * as applications from './applications';
import { DOCS_PATHS } from '../../common/services/docs-paths';

jest.mock('../redux/store', () => ({ getState: () => ({}) }));
jest.mock('../kibana-services', () => ({ getWzCurrentAppID: jest.fn() }));
jest.mock('../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('applications', () => {
  it.each([
    ['fileIntegrityMonitoring', 'fileIntegrityMonitoring'],
    ['threatHunting', 'threatHunting'],
    ['vulnerabilityDetection', 'vulnerabilityDetection'],
    ['mitreAttack', 'mitreAttack'],
    ['caseManagement', 'caseManagement'],
    ['malwareDetection', 'malwareDetection'],
    ['configurationAssessment', 'configurationAssessment'],
    ['ITHygiene', 'itHygiene'],
    ['activeResponses', 'incidentResponse'],
    ['regulatoryCompliance', 'regulatoryCompliance'],
    ['docker', 'docker'],
    ['amazonWebServices', 'amazonWebServices'],
    ['googleCloud', 'googleCloud'],
    ['github', 'github'],
    ['office365', 'office365'],
    ['microsoftGraphAPI', 'microsoftGraphApi'],
    ['security', 'apiRbac'],
  ] as const)(
    'links %s to its docs page from the Help menu',
    (application, docsKey) => {
      expect(applications[application].docsUrl).toBe(
        `https://docs.example/${DOCS_PATHS[docsKey]}`,
      );
    },
  );
});
