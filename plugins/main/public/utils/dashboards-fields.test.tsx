import { getDashboardPanels as clusterPanels } from '../components/management/cluster/dashboard/dashboard_panels';
import {
  idExtractor,
  compareColumnsValue,
  clusterQExtractor,
} from './functions-to-test';
import { KnownFields } from './known-fields-loader';
import { WAZUH_EVENTS_PATTERN } from '../../common/constants';
import { tParsedIndexPattern } from '../components/common/data-source';

const dashboardPanels = {
  welcome: '../components/common/welcome/dashboard/dashboard_panels',
  mitre: '../components/overview/mitre/dashboard/dashboard-panels',
  aws: '../components/overview/amazon-web-services/dashboards/dashboard_panels',
  docker: '../components/overview/docker/dashboards/dashboard-panels',
  fim: '../components/overview/fim/dashboard/dashboard-panels',
  gdpr: '../components/overview/gdpr/dashboards/dashboard-panels',
  github: '../components/overview/github/dashboards/dashboard-panels',
  googleCloud:
    '../components/overview/google-cloud/dashboards/dashboard_panels',
  hipaa: '../components/overview/hipaa/dashboards/dashboard-panels',
  malwareDetection:
    '../components/overview/malware-detection/dashboard/dashboard-panels',
  nist: '../components/overview/nist/dashboards/dashboard-panels',
  pci: '../components/overview/pci/dashboards/dashboard-panels',
  office: '../components/overview/office/dashboard/dashboard_panels',
  threatHunting:
    '../components/overview/threat-hunting/dashboard/dashboard_panels',
  tsc: '../components/overview/tsc/dashboards/dashboard-panels',
};

const panelEntries = Object.entries(dashboardPanels);

test.each(panelEntries)(
  'Test %s panels with pinned agent',
  async (name, path) => {
    const module = await import(path);
    const panelFunction = module.getDashboardPanels;
    expect(
      compareColumnsValue(
        KnownFields,
        idExtractor(panelFunction(WAZUH_EVENTS_PATTERN, true)),
      ),
    ).toBe(true);
  },
);

test.each(panelEntries)(
  'Test %s panels without pinned agent',
  async (name, path) => {
    const module = await import(path);
    const panelFunction = module.getDashboardPanels;
    expect(
      compareColumnsValue(
        KnownFields,
        idExtractor(panelFunction(WAZUH_EVENTS_PATTERN, false)),
      ),
    ).toBe(true);
  },
);

test(`Test cluster panels`, () => {
  const nodeListMock = [{ name: 'node1' }, { name: 'node2' }];
  const mockIndexPattern: tParsedIndexPattern = {
    id: WAZUH_EVENTS_PATTERN,
    title: WAZUH_EVENTS_PATTERN,
    attributes: {
      title: WAZUH_EVENTS_PATTERN,
      fields: '[]',
    },
    migrationVersion: {
      'index-pattern': '7.10.0',
    },
    namespace: ['default'],
    references: [],
    score: 0,
    type: 'index-pattern',
    updated_at: '2021-08-23T14:05:54.000Z',
    version: 'WzIwMjEsM',
    _fields: [],
  };
  expect(
    compareColumnsValue(
      KnownFields,
      clusterQExtractor(
        clusterPanels(mockIndexPattern, nodeListMock, 'manager'),
      ),
    ),
  ).toBe(true);
});
