import React from 'react';
import { getDashboardPanels as clusterPanels } from '../components/management/cluster/dashboard/dashboard_panels';
import {
  idExtractor,
  compareColumnsValue,
  clusterQExtractor,
} from './functions-to-test';
import { KnownFields } from './known-fields';

const INDEX_PATTERN_ALERTS = 'wazuh-alerts-*';

const dashboardPanels = {
  wellcome: '../components/common/welcome/dashboard/dashboard_panels',
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
        idExtractor(panelFunction(INDEX_PATTERN_ALERTS, true)),
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
        idExtractor(panelFunction(INDEX_PATTERN_ALERTS, false)),
      ),
    ).toBe(true);
  },
);

test(`Test vulnerability panels`, () => {
  const nodeListMock = [{ name: 'node1' }, { name: 'node2' }];
  expect(
    compareColumnsValue(
      KnownFields,
      clusterQExtractor(
        clusterPanels(INDEX_PATTERN_ALERTS, nodeListMock, 'manager'),
      ),
    ),
  ).toBe(true);
});
