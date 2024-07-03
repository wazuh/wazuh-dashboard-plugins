/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_NAME = 'Report Alerts';
export const PLUGIN_ID = 'reports-alerts';

export const API_PREFIX = '/api/reports-alerts';

const BASE_REPORTS_URI = '/_plugins/_reports';

export const OPENSEARCH_REPORTS_API = {
  ON_DEMAND_REPORT: `${BASE_REPORTS_URI}/on_demand`,
  REPORT_INSTANCE: `${BASE_REPORTS_URI}/instance`,
  LIST_REPORT_INSTANCES: `${BASE_REPORTS_URI}/instances`,
  REPORT_DEFINITION: `${BASE_REPORTS_URI}/definition`,
  LIST_REPORT_DEFINITIONS: `${BASE_REPORTS_URI}/definitions`,
};

const REPORTING_NOTIFICATIONS_API_PREFIX = '/api/report_alerts_notifications';
export const REPORTING_NOTIFICATIONS_DASHBOARDS_API = Object.freeze({
  GET_CONFIGS: `${REPORTING_NOTIFICATIONS_API_PREFIX}/get_configs`,
  GET_EVENT: `${REPORTING_NOTIFICATIONS_API_PREFIX}/get_event`,
  SEND_TEST_MESSAGE: `${REPORTING_NOTIFICATIONS_API_PREFIX}/test_message`,
});

const NOTIFICATIONS_API_BASE_PATH = '/_plugins/_notifications';
export const NOTIFICATIONS_API = Object.freeze({
  CONFIGS: `${NOTIFICATIONS_API_BASE_PATH}/configs`,
  EVENTS: `${NOTIFICATIONS_API_BASE_PATH}/events`,
  TEST_MESSAGE: `${NOTIFICATIONS_API_BASE_PATH}/feature/test`,
});
