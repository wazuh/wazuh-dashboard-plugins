/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportingConfig } from 'server/config/config';
import {
  BackendReportInstanceType,
  BACKEND_DELIVERY_FORMAT,
  BACKEND_REPORT_FORMAT,
  BACKEND_REPORT_SOURCE,
  BACKEND_REPORT_STATE,
  BACKEND_TRIGGER_TYPE,
} from '../../../../model/backendModel';
import { backendToUiReport } from '../backendToUi';

const input: BackendReportInstanceType = {
  id: 'ScvStHUBQ1Iwo-aR31dV',
  lastUpdatedTimeMs: 1605056644321,
  createdTimeMs: 1605056520018,
  beginTimeMs: 1605054720000,
  endTimeMs: 1605056520000,
  access: ['roleId'],
  reportDefinitionDetails: {
    id: 'OMvRtHUBQ1Iwo-aRcFdO',
    lastUpdatedTimeMs: 1605056426053,
    createdTimeMs: 1605056426053,
    access: ['roleId'],
    reportDefinition: {
      name: 'cron-email',
      isEnabled: true,
      source: {
        description: 'some random',
        type: BACKEND_REPORT_SOURCE.dashboard,
        origin: 'http://localhost:5601',
        id: '722b74f0-b882-11e8-a6d9-e546fe2bba5f',
      },
      format: {
        duration: 'PT30M',
        fileFormat: BACKEND_REPORT_FORMAT.pdf,
        header: '<p>test header</p>',
        footer: '<p>fake footer</p>',
      },
      trigger: {
        triggerType: BACKEND_TRIGGER_TYPE.cronSchedule,
        schedule: {
          cron: {
            expression: '2 17 * * *',
            timezone: 'PST8PDT',
          },
        },
      },
      delivery: {
        title: 'test email subject',
        textDescription: '- test\n- optional\n- message',
        htmlDescription:
          '<ul>\n<li>test</li>\n<li>optional</li>\n<li>message</li>\n</ul>',
        configIds: [],
      },
    },
  },
  status: BACKEND_REPORT_STATE.success,
};

const sampleServerBasePath = '/test';

const output = {
  query_url: `${sampleServerBasePath}/app/dashboards#/view/722b74f0-b882-11e8-a6d9-e546fe2bba5f?_g=(time:(from:'2020-11-11T00:32:00.000Z',to:'2020-11-11T01:02:00.000Z'))`,
  time_from: 1605054720000,
  time_to: 1605056520000,
  last_updated: 1605056644321,
  time_created: 1605056520018,
  state: 'Shared',
  report_definition: {
    report_params: {
      report_name: 'cron-email',
      report_source: 'Dashboard',
      description: 'some random',
      core_params: {
        base_url: `${sampleServerBasePath}/app/dashboards#/view/722b74f0-b882-11e8-a6d9-e546fe2bba5f`,
        report_format: 'pdf',
        header: '<p>test header</p>',
        footer: '<p>fake footer</p>',
        time_duration: 'PT30M',
        origin: 'http://localhost:5601',
        window_width: 1600,
        window_height: 800,
      },
    },
    trigger: {
      trigger_type: 'Schedule',
      trigger_params: {
        enabled_time: 1605056426053,
        enabled: true,
        schedule_type: 'Cron based',
        schedule: { cron: { expression: '2 17 * * *', timezone: 'PST8PDT' } },
      },
    },
    delivery: {
      title: 'test email subject',
      textDescription: '- test\n- optional\n- message',
      htmlDescription:
        '<ul>\n<li>test</li>\n<li>optional</li>\n<li>message</li>\n</ul>',
      configIds: [],
    },
    time_created: 1605056426053,
    last_updated: 1605056426053,
    status: 'Active',
  },
};

describe('test backend to ui model conversion', () => {
  test('convert backend to ui report', async () => {
    const res = backendToUiReport(input, sampleServerBasePath);
    expect(res).toEqual(output);
  }, 20000);
});
