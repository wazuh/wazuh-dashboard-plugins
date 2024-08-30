/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportDefinitionSchemaType } from 'server/model';
import {
  DELIVERY_TYPE,
  FORMAT,
  REPORT_TYPE,
  SCHEDULE_TYPE,
  TRIGGER_TYPE,
} from '../../constants';
import { uiToBackendReportDefinition } from '../uiToBackend';

/**
 * The mock and sample input.
 */
const input: ReportDefinitionSchemaType = {
  report_params: {
    report_name: 'test report table order',
    report_source: REPORT_TYPE.savedSearch,
    description: 'Hi this is your saved search on demand',
    core_params: {
      base_url: '/app/discover#/view/7adfa750-4c81-11e8-b3d7-01146121b73d',
      saved_search_id: 'ddd8f430-f2ef-11ea-8c86-81a0b21b4b67',
      report_format: FORMAT.csv,
      time_duration: 'PT5M',
      limit: 10000,
      excel: true,
      origin: 'http://localhost:5601',
    },
  },
  delivery: {
    configIds: [],
    title: '',
    textDescription: '',
    htmlDescription: ''
  },
  trigger: {
    trigger_type: TRIGGER_TYPE.schedule,
    trigger_params: {
      schedule_type: SCHEDULE_TYPE.recurring,
      schedule: {
        interval: {
          period: 2,
          unit: 'Minutes',
          start_time: 1599609062156,
        },
      },
      enabled_time: 1599609062156,
      enabled: true,
    },
  },
};

const output = {
  name: 'test report table order',
  isEnabled: true,
  source: {
    description: 'Hi this is your saved search on demand',
    type: 'SavedSearch',
    id: '7adfa750-4c81-11e8-b3d7-01146121b73d',
    origin: 'http://localhost:5601',
  },
  format: { duration: 'PT5M', fileFormat: 'Csv', limit: 10000 },
  trigger: {
    triggerType: 'IntervalSchedule',
    schedule: {
      interval: { period: 2, unit: 'Minutes', start_time: 1599609062156 },
    },
  },
  delivery: {
    configIds: [],
    title: '',
    textDescription: '',
    htmlDescription: ''
  },
};

describe('test ui to backend model conversion', () => {
  test('convert ui to backend report instance', async () => {
    const res = uiToBackendReportDefinition(input);
    expect(res).toEqual(output);
  }, 20000);
});
