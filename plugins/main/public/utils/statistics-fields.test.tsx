import React from 'react';
import { FieldsStatistics } from './statistics-fields';
import { getDashboardPanelsAnalysisEngine } from '../components/overview/server-management-statistics/dashboards/dashboard_panels_analysis_engine';
import { getDashboardPanelsListenerEngine } from '../components/overview/server-management-statistics/dashboards/dashboard_panels_listener_engine';
import { idExtractor, compareColumnsValue } from './functions-to-test';

const INDEX_PATTERN_STATISTICS = 'wazuh-statistics-*';

test('Test statistics panels in analysis engine with cluster mode', () => {
  expect(
    compareColumnsValue(
      FieldsStatistics,
      idExtractor(
        getDashboardPanelsAnalysisEngine(INDEX_PATTERN_STATISTICS, true),
      ),
    ),
  ).toBe(true);
});

test('Test statistics panels in analysis engine with disabled cluster mode', () => {
  expect(
    compareColumnsValue(
      FieldsStatistics,
      idExtractor(
        getDashboardPanelsAnalysisEngine(INDEX_PATTERN_STATISTICS, false),
      ),
    ),
  ).toBe(true);
});

test('Test statistics panels in listener engine', () => {
  expect(
    compareColumnsValue(
      FieldsStatistics,
      idExtractor(getDashboardPanelsListenerEngine(INDEX_PATTERN_STATISTICS)),
    ),
  ).toBe(true);
});
