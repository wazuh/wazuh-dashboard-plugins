/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import 'regenerator-runtime/runtime';
import { createSavedSearchReport } from '../savedSearchReportHelper';
import { reportSchema } from '../../../model';
import { mockLogger } from '../../../../test/__mocks__/loggerMock';
import _ from 'lodash';

/**
 * The mock and sample input for saved search export function.
 */
const input = {
  query_url: '/app/discover#/view/7adfa750-4c81-11e8-b3d7-01146121b73d',
  time_from: 1343576635300,
  time_to: 1596037435301,
  report_definition: {
    report_params: {
      report_name: 'test report table order',
      report_source: 'Saved search',
      description: 'Hi this is your saved search on demand',
      core_params: {
        base_url: '/app/discover#/view/7adfa750-4c81-11e8-b3d7-01146121b73d',
        saved_search_id: 'ddd8f430-f2ef-11ea-8c86-81a0b21b4b67',
        report_format: 'csv',
        time_duration: 'PT5M',
        limit: 10000,
        excel: true,
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
      trigger_type: 'On demand',
    },
  },
};

const mockDateFormat = 'MM/DD/YYYY h:mm:ss.SSS a';
const mockTimezone = 'UTC';

/**
 * Max result window size in OpenSearch index settings.
 */
const maxResultSize = 5;

describe('test create saved search report', () => {
  test('create report with valid input', async () => {
    // Check if the assumption of input is up-to-date
    reportSchema.validate(input);
  }, 20000);

  test('create report with expected file name', async () => {
    const hits: Array<{ _source: any }> = [];
    const client = mockOpenSearchClient(hits);
    const { timeCreated, fileName } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );
    expect(fileName).toContain(`test report table order_`);
  }, 20000);

  test('create report with expected file name extension', async () => {
    const csvReport = await createSavedSearchReport(
      input,
      mockOpenSearchClient([]),
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );
    expect(csvReport.fileName).toContain('.csv');

    input.report_definition.report_params.core_params.report_format = 'xlsx';
    const xlsxReport = await createSavedSearchReport(
      input,
      mockOpenSearchClient([]),
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );
    expect(xlsxReport.fileName).toContain('.xlsx');

    input.report_definition.report_params.core_params.report_format = 'csv';
  }, 20000);

  test('create report for empty data set', async () => {
    const hits: Array<{ _source: any }> = [];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );
    expect(dataUrl).toEqual('');
  }, 20000);

  test('create report for small data set by single search', async () => {
    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        'c1,Male\n' +
        'c2,Male\n' +
        'c3,Male\n' +
        'c4,Male\n' +
        'c5,Male'
    );
  }, 20000);

  test('create report for large data set by scroll', async () => {
    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c6',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c7',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c8',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c9',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c10',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c11',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        'c1,Male\n' +
        'c2,Male\n' +
        'c3,Male\n' +
        'c4,Male\n' +
        'c5,Male\n' +
        'c6,Female\n' +
        'c7,Female\n' +
        'c8,Female\n' +
        'c9,Female\n' +
        'c10,Female\n' +
        'c11,Male'
    );
  }, 20000);

  test('create report with limit smaller than max result size', async () => {
    // Assign a smaller limit than default to test
    input.report_definition.report_params.core_params.limit = 1;

    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual('category,customer_gender\n' + 'c1,Male');
  }, 20000);

  test('create report with limit greater than max result size', async () => {
    // Assign a limit just a little greater than max result size (5)
    input.report_definition.report_params.core_params.limit = 6;

    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c6',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c7',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c8',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c9',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c10',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        'c1,Male\n' +
        'c2,Male\n' +
        'c3,Male\n' +
        'c4,Male\n' +
        'c5,Male\n' +
        'c6,Female'
    );
  }, 20000);

  test('create report with limit greater than total result size', async () => {
    // Assign a limit even greater than the result size
    input.report_definition.report_params.core_params.limit = 10;

    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c6',
          customer_gender: 'Female',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        'c1,Male\n' +
        'c2,Male\n' +
        'c3,Male\n' +
        'c4,Male\n' +
        'c5,Male\n' +
        'c6,Female'
    );
  }, 20000);

  test('create report for data set with comma', async () => {
    const hits = [
      hit(
        {
          category: ',c1',
          customer_gender: 'Ma,le',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2,',
          customer_gender: 'M,ale',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',,c3',
          customer_gender: 'Male,,,',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        '",c1","Ma,le"\n' +
        '"c2,","M,ale"\n' +
        '",,c3","Male,,,"'
    );
  }, 20000);

  test('create report for data set with comma and custom separator', async () => {
    const hits = [
      hit(
        {
          category: ',c1',
          customer_gender: 'Ma,le',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2,',
          customer_gender: 'M,ale',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',,c3',
          customer_gender: 'Male,,,',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      '|',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category|customer_gender\n' +
        ',c1|Ma,le\n' +
        'c2,|M,ale\n' +
        ',,c3|Male,,,'
    );
  }, 20000);

  test('create report for data set with nested fields', async () => {
    const hits = [
      hit(
        {
          'geoip.country_iso_code': 'GB',
          'geoip.location': { lon: -0.1, lat: 51.5 },
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          'geoip.country_iso_code': 'US',
          'geoip.city_name': 'New York',
          'geoip.location': { lon: -74, lat: 40.8 },
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(
      hits,
      '"geoip.country_iso_code", "geoip.city_name", "geoip.location"'
    );
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'geoip\\.country_iso_code,geoip\\.location\\.lon,geoip\\.location\\.lat,geoip\\.city_name\n' +
        'GB,-0.1,51.5, \n' +
        'US,-74,40.8,New York'
    );
  }, 20000);

  test('create report by sanitizing data set for Excel', async () => {
    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: '=Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male=',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: '+Ma,le',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',-c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',,,@c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        `c1,'=Male\n` +
        `c2,Male=\n` +
        `c3,"'+Ma,le"\n` +
        `",-c4",Male\n` +
        `",,,@c5",Male`
    );
  }, 20000);

  test('create report by not sanitizing data set for Excel', async () => {
    // Enable Excel escape option
    input.report_definition.report_params.core_params.excel = false;

    const hits = [
      hit(
        {
          category: 'c1',
          customer_gender: '=Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c2',
          customer_gender: 'Male=',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: 'c3',
          customer_gender: '+Ma,le',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',-c4',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
      hit(
        {
          category: ',,,@c5',
          customer_gender: 'Male',
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          products: { created_on: '2023-04-26T04:34:32Z' },
        },
        {
          customer_birth_date: '2023-04-26T04:34:32Z',
          order_date: '2023-04-26T04:34:32Z',
          'products.created_on': '2023-04-26T04:34:32Z',
        }
      ),
    ];
    const client = mockOpenSearchClient(hits);
    const { dataUrl } = await createSavedSearchReport(
      input,
      client,
      mockDateFormat,
      ',',
      true,
      undefined,
      mockLogger,
      mockTimezone
    );

    expect(dataUrl).toEqual(
      'category,customer_gender\n' +
        'c1,=Male\n' +
        'c2,Male=\n' +
        'c3,"+Ma,le"\n' +
        '",-c4",Male\n' +
        '",,,@c5",Male'
    );
  }, 20000);
});

test('create report for data set contains null field value', async () => {
  const hits = [
    hit(
      {
        category: 'c1',
        customer_gender: 'Ma',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c2',
        customer_gender: 'le',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c3',
        customer_gender: null,
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
  ];
  const client = mockOpenSearchClient(hits);
  const { dataUrl } = await createSavedSearchReport(
    input,
    client,
    mockDateFormat,
    ',',
    true,
    undefined,
    mockLogger,
    mockTimezone
  );

  expect(dataUrl).toEqual(
    'category,customer_gender\n' + 'c1,Ma\n' + 'c2,le\n' + 'c3, '
  );
}, 20000);

test('create report for data set with metadata fields', async () => {
  const metadataFields = { _index: 'nameofindex', _id: 'someid' };
  let hits = [
    hit(
      {
        category: 'c1',
        customer_gender: 'Male',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c2',
        customer_gender: 'Male',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c3',
        customer_gender: 'Male',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c4',
        customer_gender: 'Male',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c5',
        customer_gender: 'Male',
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        customer_birth_date: '2023-04-26T04:34:32Z',
        order_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
  ];
  hits.forEach((i) => {
    _.merge(i, metadataFields);
  });

  const client = mockOpenSearchClient(
    hits,
    '"category", "customer_gender","_index","_id"'
  );
  const { dataUrl } = await createSavedSearchReport(
    input,
    client,
    mockDateFormat,
    ',',
    true,
    undefined,
    mockLogger,
    mockTimezone
  );

  expect(dataUrl).toEqual(
    'category,customer_gender,_index,_id\n' +
      'c1,Male,nameofindex,someid\n' +
      'c2,Male,nameofindex,someid\n' +
      'c3,Male,nameofindex,someid\n' +
      'c4,Male,nameofindex,someid\n' +
      'c5,Male,nameofindex,someid'
  );
}, 20000);

test('create report with Etc/GMT-2 Timezone', async () => {
  const hits = [
    hit(
      { category: 'c1', customer_gender: 'Ma', order_date: [] },
      { order_date: [] }
    ),
    hit(
      {
        category: 'c2',
        customer_gender: 'le',
        order_date: ['2021-12-16T14:04:55'],
      },
      { order_date: ['2021-12-16T14:04:55'] }
    ),
    hit(
      {
        category: 'c3',
        customer_gender: 'he',
        order_date: ['2021-12-17T14:04:55', '2021-12-18T14:04:55'],
      },
      { order_date: ['2021-12-17T14:04:55', '2021-12-18T14:04:55'] }
    ),
    hit(
      {
        category: 'c4',
        customer_gender: 'te',
        order_date: '2021-12-19T14:04:55',
      },
      { order_date: ['2021-12-19T14:04:55'] }
    ),
  ];
  const client = mockOpenSearchClient(
    hits,
    '"category", "customer_gender", "order_date"'
  );
  const { dataUrl } = await createSavedSearchReport(
    input,
    client,
    mockDateFormat,
    ',',
    true,
    undefined,
    mockLogger,
    "Etc/GMT-2"
  );

  expect(dataUrl).toEqual(
    'category,customer_gender,order_date\n' +
      'c1,Ma,[]\n' +
      'c2,le,"[""12/16/2021 4:04:55.000 pm""]"\n' +
      'c3,he,"[""12/17/2021 4:04:55.000 pm"",""12/18/2021 4:04:55.000 pm""]"\n' +
      'c4,te,12/19/2021 4:04:55.000 pm'
  );
}, 20000);

test('create report with empty/one/multiple(list) date values', async () => {
  const hits = [
    hit(
      {
        category: 'c1',
        customer_gender: 'Ma',
        order_date: [],
        customer_birth_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        order_date: [],
        customer_birth_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c2',
        customer_gender: 'le',
        order_date: ['2021-12-16T14:04:55'],
        customer_birth_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        order_date: ['2021-12-16T14:04:55'],
        customer_birth_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c3',
        customer_gender: 'he',
        order_date: ['2021-12-17T14:04:55', '2021-12-18T14:04:55'],
        customer_birth_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        order_date: ['2021-12-17T14:04:55', '2021-12-18T14:04:55'],
        customer_birth_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
    hit(
      {
        category: 'c4',
        customer_gender: 'te',
        order_date: '2021-12-19T14:04:55',
        customer_birth_date: '2023-04-26T04:34:32Z',
        products: { created_on: '2023-04-26T04:34:32Z' },
      },
      {
        order_date: ['2021-12-19T14:04:55'],
        customer_birth_date: '2023-04-26T04:34:32Z',
        'products.created_on': '2023-04-26T04:34:32Z',
      }
    ),
  ];
  const client = mockOpenSearchClient(
    hits,
    '"category", "customer_gender", "order_date"'
  );
  const { dataUrl } = await createSavedSearchReport(
    input,
    client,
    mockDateFormat,
    ',',
    true,
    undefined,
    mockLogger,
    mockTimezone
  );
  expect(dataUrl).toEqual(
    'category,customer_gender,order_date\n' +
      'c1,Ma,[]\n' +
      'c2,le,"[""12/16/2021 2:04:55.000 pm""]"\n' +
      'c3,he,"[""12/17/2021 2:04:55.000 pm"",""12/18/2021 2:04:55.000 pm""]"\n' +
      'c4,te,12/19/2021 2:04:55.000 pm'
  );
}, 20000);

/**
 * Mock Elasticsearch client and return different mock objects based on endpoint and parameters.
 */
function mockOpenSearchClient(
  mockHits: Array<{ _source: any; fields: any }>,
  columns = '"category", "customer_gender"'
) {
  let call = 0;
  const client = jest.fn();
  client.callAsInternalUser = jest
    .fn()
    .mockImplementation((endpoint: string, params: any) => {
      switch (endpoint) {
        case 'get':
          return {
            _source: params.id.startsWith('index-pattern:')
              ? mockIndexPattern()
              : mockSavedSearch(columns),
          };
        case 'indices.getSettings':
          return mockIndexSettings();
        case 'count':
          return {
            count: mockHits.length,
          };
        case 'search':
          return {
            hits: {
              hits: mockHits.slice(0, params.size),
            },
          };
        case 'scroll':
          call++;
          return {
            hits: {
              hits: mockHits.slice(
                maxResultSize * call,
                maxResultSize * (call + 1)
              ),
            },
          };
        case 'clearScroll':
          return null;
        default:
          fail('Fail due to unexpected function call on client', endpoint);
      }
    });
  return client;
}

/**
 * Mock a saved search for opensearch_dashboards_sample_data_ecommerce with 2 default selected fields: category and customer_gender.
 */
function mockSavedSearch(columns = '"category", "customer_gender"') {
  return JSON.parse(`
  {
    "type": "search",
    "id": "ddd8f430-f2ef-11ea-8c86-81a0b21b4b67",
    "search": {
      "title": "Show category and gender",
      "description": "",
      "hits": 0,
      "columns": [ ${columns} ],
      "sort": [],
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\\"highlightAll\\":true,\\"version\\":true,\\"query\\":{\\"query\\":\\"\\",\\"language\\":\\"kuery\\"},\\"indexRefName\\":\\"kibanaSavedObjectMeta.searchSourceJSON.index\\",\\"filter\\":[]}"
      }
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "ff959d40-b880-11e8-a6d9-e546fe2bba5f"
      }
    ]
  }
  `);
}

/**
 * Mock index pattern for opensearch_dashboards_sample_data_ecommerce.
 */
function mockIndexPattern() {
  return JSON.parse(`
  {
    "index-pattern": {
      "title": "opensearch_dashboards_sample_data_ecommerce",
      "timeFieldName": "order_date",
      "fields": "[{\\"name\\":\\"_id\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"_id\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":false},{\\"name\\":\\"_index\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"_index\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":false},{\\"name\\":\\"_score\\",\\"type\\":\\"number\\",\\"count\\":0,\\"scripted\\":false,\\"searchable\\":false,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"_source\\",\\"type\\":\\"_source\\",\\"opensearchTypes\\":[\\"_source\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":false,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"_type\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"_type\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":false},{\\"name\\":\\"category\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":2,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"category.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"category\\"}}},{\\"name\\":\\"currency\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"customer_birth_date\\",\\"type\\":\\"date\\",\\"opensearchTypes\\":[\\"date\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"customer_first_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"customer_first_name.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"customer_first_name\\"}}},{\\"name\\":\\"customer_full_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"customer_full_name.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"customer_full_name\\"}}},{\\"name\\":\\"customer_gender\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":2,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"customer_id\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"customer_last_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"customer_last_name.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"customer_last_name\\"}}},{\\"name\\":\\"customer_phone\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"day_of_week\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"day_of_week_i\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"integer\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"email\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"geoip.city_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"geoip.continent_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"geoip.country_iso_code\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"geoip.location\\",\\"type\\":\\"geo_point\\",\\"opensearchTypes\\":[\\"geo_point\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"geoip.region_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"manufacturer\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"manufacturer.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"manufacturer\\"}}},{\\"name\\":\\"order_date\\",\\"type\\":\\"date\\",\\"opensearchTypes\\":[\\"date\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"order_id\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products._id\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"products._id.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"products._id\\"}}},{\\"name\\":\\"products.base_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.base_unit_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.category\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"products.category.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"products.category\\"}}},{\\"name\\":\\"products.created_on\\",\\"type\\":\\"date\\",\\"opensearchTypes\\":[\\"date\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.discount_amount\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.discount_percentage\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.manufacturer\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"products.manufacturer.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"products.manufacturer\\"}}},{\\"name\\":\\"products.min_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.product_id\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"long\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.product_name\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"text\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"name\\":\\"products.product_name.keyword\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"products.product_name\\"}}},{\\"name\\":\\"products.quantity\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"integer\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.sku\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.tax_amount\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.taxful_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.taxless_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"products.unit_discount_amount\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"sku\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"taxful_total_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"taxless_total_price\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"half_float\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"total_quantity\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"integer\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"total_unique_products\\",\\"type\\":\\"number\\",\\"opensearchTypes\\":[\\"integer\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"type\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"name\\":\\"user\\",\\"type\\":\\"string\\",\\"opensearchTypes\\":[\\"keyword\\"],\\"count\\":0,\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true}]",
      "fieldFormatMap": "{\\"taxful_total_price\\":{\\"id\\":\\"number\\",\\"params\\":{\\"parsedUrl\\":{\\"origin\\":\\"http://localhost:5601\\",\\"pathname\\":\\"/app/opensearch_dashboards\\",\\"basePath\\":\\"\\"},\\"pattern\\":\\"$0,0.[00]\\"}}}"
    }
  }
  `);
}

/**
 * Mock index settings for opensearch_dashboards_sample_data_ecommerce.
 */
function mockIndexSettings() {
  return JSON.parse(`
  {
    "opensearch_dashboards_sample_data_ecommerce": {
      "settings": {
        "index": {
          "number_of_shards": "1",
          "auto_expand_replicas": "0-1",
          "provided_name": "opensearch_dashboards_sample_data_ecommerce",
          "max_result_window": "${maxResultSize}",
          "creation_date": "1594417718898",
          "number_of_replicas": "0",
          "uuid": "0KnfmEsaTYKg39ONcrA5Eg",
          "version": {
            "created": "7080099"
          }
        }
      }
    }
  }
  `);
}

function hit(source_kv: any, fields_kv = {}) {
  return {
    _source: source_kv,
    fields: fields_kv,
  };
}
