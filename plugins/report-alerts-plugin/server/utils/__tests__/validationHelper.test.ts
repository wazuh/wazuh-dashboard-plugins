/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportDefinitionSchemaType, ReportSchemaType } from '../../model';
import {
  FORMAT,
  REPORT_TYPE,
  TRIGGER_TYPE,
} from '../../routes/utils/constants';
import {
  isValidRelativeUrl,
  regexDuration,
  validateReport,
  validateReportDefinition,
} from '../validationHelper';

const SAMPLE_SAVED_OBJECT_ID = '3ba638e0-b894-11e8-a6d9-e546fe2bba5f';
const createReportDefinitionInput: ReportDefinitionSchemaType = {
  report_params: {
    report_name: 'test visual report',
    report_source: REPORT_TYPE.dashboard,
    description: 'Hi this is your Dashboard on demand',
    core_params: {
      base_url: `/app/dashboards#/view/${SAMPLE_SAVED_OBJECT_ID}`,
      window_width: 1300,
      window_height: 900,
      report_format: FORMAT.pdf,
      time_duration: 'PT5M',
      origin: 'http://localhost:5601',
    },
  },
  delivery: {
    configIds: [],
    title: 'title',
    textDescription: 'text description',
    htmlDescription: 'html description',
  },
  trigger: {
    trigger_type: TRIGGER_TYPE.onDemand,
  },
};
const createReportInput: ReportSchemaType = {
  query_url: `/app/dashboards#/view/${SAMPLE_SAVED_OBJECT_ID}`,
  time_from: 1343576635300,
  time_to: 1596037435301,
  report_definition: createReportDefinitionInput,
};

// this is the url format used before notebooks merged into observability
const createReportDefinitionNotebookLegacyInput: ReportDefinitionSchemaType = {
  report_params: {
    report_name: 'test notebooks report',
    report_source: REPORT_TYPE.notebook,
    description: 'Hi this is your Notebook on demand',
    core_params: {
      base_url: `/app/notebooks-dashboards?view=output_only#/${SAMPLE_SAVED_OBJECT_ID}`,
      window_width: 1300,
      window_height: 900,
      report_format: FORMAT.pdf,
      time_duration: 'PT5M',
      origin: 'http://localhost:5601',
    },
  },
  delivery: {
    configIds: [],
    title: 'title',
    textDescription: 'text description',
    htmlDescription: 'html description',
  },
  trigger: {
    trigger_type: TRIGGER_TYPE.onDemand,
  },
};

const createReportDefinitionNotebookInput: ReportDefinitionSchemaType = {
  report_params: {
    report_name: 'test notebooks report',
    report_source: REPORT_TYPE.notebook,
    description: 'Hi this is your Notebook on demand',
    core_params: {
      base_url: `/app/observability-dashboards#/notebooks/${SAMPLE_SAVED_OBJECT_ID}`,
      window_width: 1300,
      window_height: 900,
      report_format: FORMAT.pdf,
      time_duration: 'PT5M',
      origin: 'http://localhost:5601',
    },
  },
  delivery: {
    configIds: [],
    title: 'title',
    textDescription: 'text description',
    htmlDescription: 'html description',
  },
  trigger: {
    trigger_type: TRIGGER_TYPE.onDemand,
  },
};

const createReportDefinitionNotebookPostNavBarInput: ReportDefinitionSchemaType = {
  report_params: {
    report_name: 'test notebooks report',
    report_source: REPORT_TYPE.notebook,
    description: 'Hi this is your Notebook on demand',
    core_params: {
      base_url: `/app/observability-notebooks#/${SAMPLE_SAVED_OBJECT_ID}`,
      window_width: 1300,
      window_height: 900,
      report_format: FORMAT.pdf,
      time_duration: 'PT5M',
      origin: 'http://localhost:5601',
    },
  },
  delivery: {
    configIds: [],
    title: 'title',
    textDescription: 'text description',
    htmlDescription: 'html description',
  },
  trigger: {
    trigger_type: TRIGGER_TYPE.onDemand,
  },
};

describe('test input validation', () => {
  test('create report with correct saved object id', async () => {
    const savedObjectIds = [`dashboard:${SAMPLE_SAVED_OBJECT_ID}`];
    const client = mockOpenSearchClient(savedObjectIds);
    const report = await validateReport(client, createReportInput);
    expect(report).toBeDefined();
  });

  test('create report with non-exist saved object id', async () => {
    const savedObjectIds = ['dashboard:fake-id'];
    const client = mockOpenSearchClient(savedObjectIds);
    await expect(
      validateReport(client, createReportInput)
    ).rejects.toThrowError(
      `saved object with id dashboard:${SAMPLE_SAVED_OBJECT_ID} does not exist`
    );
  });

  test('create report definition with correct saved object id', async () => {
    const savedObjectIds = [`dashboard:${SAMPLE_SAVED_OBJECT_ID}`];
    const client = mockOpenSearchClient(savedObjectIds);
    const report = await validateReportDefinition(
      client,
      createReportDefinitionInput
    );
    expect(report).toBeDefined();
  });

  test('create notebook report definition with legacy base url format', async () => {
    const savedObjectIds = [`notebook:${SAMPLE_SAVED_OBJECT_ID}`];
    const client = mockOpenSearchClient(savedObjectIds);
    const report = await validateReportDefinition(
      client,
      createReportDefinitionNotebookLegacyInput
    );
    expect(report).toBeDefined();
  });

  test('create notebook report definition with correct base url format', async () => {
    const savedObjectIds = [`notebook:${SAMPLE_SAVED_OBJECT_ID}`];
    const client = mockOpenSearchClient(savedObjectIds);
    const report = await validateReportDefinition(
      client,
      createReportDefinitionNotebookInput
    );
    expect(report).toBeDefined();
  });

  test('create notebook report definition with notebook base url format', async () => {
    const savedObjectIds = [`notebook:${SAMPLE_SAVED_OBJECT_ID}`];
    const client = mockOpenSearchClient(savedObjectIds);
    const report = await validateReportDefinition(
      client,
      createReportDefinitionNotebookPostNavBarInput
    );
    expect(report).toBeDefined();
  });

  test('create report definition with non-exist saved object id', async () => {
    const savedObjectIds = ['dashboard:fake-id'];
    const client = mockOpenSearchClient(savedObjectIds);
    await expect(
      validateReportDefinition(client, createReportDefinitionInput)
    ).rejects.toThrowError(
      `saved object with id dashboard:${SAMPLE_SAVED_OBJECT_ID} does not exist`
    );
  });

  test('validation against query_url', async () => {
    const urls: Array<[string, boolean]> = [
      ['/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=', true],
      [
        '/_plugin/kibana/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=',
        true,
      ],
      [
        '/_dashboards/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=',
        true,
      ],
      [
        '/_dashboards/app/dashboards#/edit/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=',
        true,
      ],
      [
        '/app/observability-dashboards?security_tenant=private#/notebooks/NYdlPIIB0-fJ8Bh1nLdW?view=output_only',
        true,
      ],
      [
        '/app/notebooks-dashboards?view=output_only&security_tenant=private#/M4dlPIIB0-fJ8Bh1nLc7?security_tenant=private',
        true,
      ],
      [
        '/_dashboards/app/visualize&security_tenant=/.%2e/.%2e/.%2e/.%2e/_dashboards?#/view/id',
        false,
      ],
      [
        '/app/data-explorer/discover/#/view/571aaf70-4c88-11e8-b3d7-01146121b73d',
        true,
      ],
      [
        '/app/data-explorer/discover?security_tenant=private#/view/571aaf70-4c88-11e8-b3d7-01146121b73d',
        true,
      ],
      ['/app/discoverLegacy#/view/571aaf70-4c88-11e8-b3d7-01146121b73d', true],
    ];
    expect(urls.map((url) => isValidRelativeUrl(url[0]))).toEqual(
      urls.map((url) => url[1])
    );
  });

  test('validate ISO 8601 durations', () => {
    const durations: Array<[string, boolean]> = [
      ['PT30M', true],
      ['PT-30M', true],
      ['PT-2H-30M', true],
    ];
    expect(
      durations.map((duration) => regexDuration.test(duration[0]))
    ).toEqual(durations.map((duration) => duration[1]));
  });
});

// TODO: merge this with other mock clients used in testing, to create some mock helpers file
const mockOpenSearchClient = (mockSavedObjectIds: string[]) => {
  const client = {
    callAsCurrentUser: jest
      .fn()
      .mockImplementation((endpoint: string, params: any) => {
        switch (endpoint) {
          case 'exists':
            return mockSavedObjectIds.includes(params.id);
          default:
            fail('Fail due to unexpected function call on client');
        }
      }),
  };

  return client;
};
