/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const reportTableMockResponse = [
  {
    _id: '123456',
    _index: 'test',
    _score: 1,
    _source: {
      last_updated: 123456789,
      query_url: 'test_query_url_value.com',
      report_definition: {
        delivery: {
          delivery_type: 'OpenSearch Dashboards user',
          delivery_params: {
            opensearch_dashboards_recipients: [],
          },
        },
        report_params: {
          report_name: 'Test report table response',
          description: 'description',
          report_source: 'Dashboard',
          core_params: {
            base_url: 'test_base_url.com',
            header: '',
            footer: '',
            report_format: 'pdf',
            time_duration: 'PT30M',
            window_height: 800,
            window_width: 1200,
          },
        },
        trigger: {
          trigger_type: 'On demand',
        },
        state: 'Created',
        time_created: 123456780,
        time_from: 123456780,
        time_to: 123456799,
      },
    },
    _type: 'doc',
  },
];

export const mockReportsTableItems = [
  {
    id: '123456',
    reportName: 'Test report table response',
    type: 'On demand',
    sender: '—',
    opensearchDashboardsRecipients: '—',
    emailRecipients: '—',
    reportSource: 'Dashboard',
    timeCreated: undefined,
    state: undefined,
    url: 'test_query_url_value.com',
    format: 'pdf',
  },
];

export const reportDefinitionsTableMockResponse = [
  {
    _index: 'report_definition',
    _type: '_doc',
    _id: '42MmKXUBDW-VXnk7pa6d',
    _score: 1,
    _source: {
      report_definition: {
        report_params: {
          report_name: 'schedule definition',
          report_source: 'Dashboard',
          description: 'description',
          core_params: {
            base_url: 'test_base_url.com',
            report_format: 'pdf',
            header: '',
            footer: '',
            time_duration: 'PT30M',
            window_width: 1200,
            window_height: 800,
          },
        },
        delivery: {
          delivery_type: 'OpenSearch Dashboards user',
          delivery_params: { opensearch_dashboards_recipients: [] },
        },
        trigger: {
          trigger_type: 'Schedule',
          trigger_params: {
            enabled_time: 1602713178321,
            schedule: {
              period: 1,
              interval: 'DAYS',
            },
            schedule_type: 'Recurring',
            enabled: false,
          },
        },
        time_created: 1602713199604,
        last_updated: 1602713211007,
        status: 'Disabled',
      },
    },
  },
];

export const reportDefinitionsTableMockContent = [
  {
    id: '42MmKXUBDW-VXnk7pa6d',
    reportName: 'schedule definition',
    type: 'Schedule',
    owner: '—',
    source: 'Dashboard',
    baseUrl: 'test_base_url.com',
    lastUpdated: 1602713211007,
    details: 'Recurring',
    status: 'Disabled',
  },
];
