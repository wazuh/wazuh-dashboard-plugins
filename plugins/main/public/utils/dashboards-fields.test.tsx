import React from 'react';
import { KnownFields } from './known-fields';
import { getDashboardPanelsAnalysisEngine } from '../components/overview/server-management-statistics/dashboards/dashboard_panels_analysis_engine';
import { getDashboardPanelsListenerEngine } from '../components/overview/server-management-statistics/dashboards/dashboard_panels_listener_engine';
import { idExtractor, compareColumnsValue } from './functions-to-test';
import { getDashboardPanels as vulnerabilitiesPanels } from '../components/overview/vulnerabilities/dashboards/overview/dashboard_panels';
import { getDashboardPanels as clusterPanels } from '../components/management/cluster/dashboard/dashboard_panels';

const panelSourcesWithAgents = {
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

const dashboardPanelsWithAgents = Object.fromEntries(
  Object.entries(panelSourcesWithAgents).map(([key, path]) => [
    key,
    require(path).getDashboardPanels,
  ]),
);

test('Test statistics panels in analysis engine with cluster mode', () => {
  expect(
    compareColumnsValue(
      KnownFields,
      idExtractor(getDashboardPanelsAnalysisEngine('index-pattern', true)),
    ),
  ).toBe(true);
});

test('Test statistics panels in analysis engine with disabled cluster mode', () => {
  expect(
    compareColumnsValue(
      KnownFields,
      idExtractor(getDashboardPanelsAnalysisEngine('index-pattern', false)),
    ),
  ).toBe(true);
});

test('Test statistics panels in listener engine', () => {
  expect(
    compareColumnsValue(
      KnownFields,
      idExtractor(getDashboardPanelsListenerEngine('index-pattern')),
    ),
  ).toBe(true);
});

Object.entries(dashboardPanelsWithAgents).forEach(([name, panelFunction]) => {
  test(`Test ${name} panels with pinned agent`, () => {
    expect(
      compareColumnsValue(
        KnownFields,
        idExtractor(panelFunction('index-pattern', true)),
      ),
    ).toBe(true);
  });

  test(`Test ${name} panels without pinned agent`, () => {
    expect(
      compareColumnsValue(
        KnownFields,
        idExtractor(panelFunction('index-pattern', false)),
      ),
    ).toBe(true);
  });
});

test(`Test vulnerability panels`, () => {
  expect(
    compareColumnsValue(
      KnownFields,
      idExtractor(vulnerabilitiesPanels('index-pattern')),
    ),
  ).toBe(true);
});

test(`Test vulnerability panels`, () => {
  expect(
    compareColumnsValue(
      KnownFields,
      idExtractor(clusterPanels('index-pattern', [], 'manager')),
    ),
  ).toBe(true);
});
