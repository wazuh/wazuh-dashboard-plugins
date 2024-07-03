/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getDashboardBaseUrlCreate,
  getDashboardOptions,
  getSavedSearchBaseUrlCreate,
  getSavedSearchOptions,
  getVisualizationBaseUrlCreate,
  getVisualizationOptions,
  handleDataToVisualReportSourceChange,
  parseInContextUrl,
} from '../report_settings_helpers';

const TEST_DEFINITION_ID = '12345';

describe('report_settings_helpers tests', () => {
  test('parseInContextUrl', () => {
    const urlString =
      'http://localhost:5601/app/reports-alerts#/create?previous=dashboard:7adfa750-4c81-11e8-b3d7-01146121b73d?timeFrom=2020-10-26T20:52:56.382Z?timeTo=2020-10-27T20:52:56.384Z';

    const id = parseInContextUrl(urlString, 'id');
    expect(id).toBe('7adfa750-4c81-11e8-b3d7-01146121b73d');

    const timeFrom = parseInContextUrl(urlString, 'timeFrom');
    expect(timeFrom).toBe('2020-10-26T20:52:56.382Z');

    const timeTo = parseInContextUrl(urlString, 'timeTo');
    expect(timeTo).toBe('2020-10-27T20:52:56.384Z');

    const error = parseInContextUrl(urlString, 'invalid');
    expect(error).toBe('error: invalid parameter');
  });

  test('getDashboardBaseUrlCreate', () => {
    const baseUrl = getDashboardBaseUrlCreate(true, TEST_DEFINITION_ID, true);
    expect(baseUrl).toBe('/app/dashboards#/view/');

    const baseUrlNotFromEdit = getDashboardBaseUrlCreate(
      false,
      TEST_DEFINITION_ID,
      true
    );
    expect(baseUrlNotFromEdit).toBe('/app/dashboards#/view/');
  });

  test('getDashboardBaseUrlCreate not from in-context', () => {
    const baseUrl = getDashboardBaseUrlCreate(false, TEST_DEFINITION_ID, false);
    expect(baseUrl).toBe('/');
  });

  test('getVisualizationBaseUrlCreate', () => {
    const baseUrl = getVisualizationBaseUrlCreate(
      true,
      TEST_DEFINITION_ID,
      true
    );
    expect(baseUrl).toBe('/app/visualize#/edit/');

    const baseUrlNotFromEdit = getVisualizationBaseUrlCreate(
      false,
      TEST_DEFINITION_ID,
      true
    );
    expect(baseUrlNotFromEdit).toBe('/app/visualize#/edit/');
  });

  test('getVisualizationBaseUrlCreate not from in-context', () => {
    const baseUrl = getVisualizationBaseUrlCreate(
      false,
      TEST_DEFINITION_ID,
      false
    );
    expect(baseUrl).toBe('/');
  });

  test('getSavedSearchBaseUrlCreate', () => {
    const baseUrl = getSavedSearchBaseUrlCreate(true, TEST_DEFINITION_ID, true);
    expect(baseUrl).toBe('/app/discover#/view/');

    const baseUrlNotFromEdit = getSavedSearchBaseUrlCreate(
      false,
      TEST_DEFINITION_ID,
      true
    );
    expect(baseUrlNotFromEdit).toBe('/app/discover#/view/');
  });

  test('getSavedSearchBaseUrlCreate not from in-context', () => {
    const baseUrl = getSavedSearchBaseUrlCreate(
      false,
      TEST_DEFINITION_ID,
      false
    );
    expect(baseUrl).toBe('/');
  });

  test('getDashboardOptions', () => {
    const mockData = [
      {
        _id: 'dashboard:1234567890abcdefghijk',
        _source: {
          dashboard: {
            title: 'Mock dashboard title',
          },
        },
      },
    ];

    const options = getDashboardOptions(mockData);
    expect(options[0].value).toBe('1234567890abcdefghijk');
    expect(options[0].label).toBe('Mock dashboard title');
  });

  test('getVisualizationOptions', () => {
    const mockData = [
      {
        _id: 'visualization:1234567890abcdefghijk',
        _source: {
          visualization: {
            title: 'Mock visualization title',
          },
        },
      },
    ];

    const options = getVisualizationOptions(mockData);
    expect(options[0].value).toBe('1234567890abcdefghijk');
    expect(options[0].label).toBe('Mock visualization title');
  });

  test('getSavedSearchOptions', () => {
    const mockData = [
      {
        _id: 'search:1234567890abcdefghijk',
        _source: {
          search: {
            title: 'Mock saved search title',
          },
        },
      },
    ];
    const options = getSavedSearchOptions(mockData);
    expect(options[0].value).toBe('1234567890abcdefghijk');
    expect(options[0].label).toBe('Mock saved search title');
  });

  test('handleDataToVisualReportSourceChange', () => {
    let reportDefinitionRequest = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Dashboard',
        description: '',
        core_params: {
          report_format: '',
          saved_search_id: '',
          limit: 10,
          excel: true,
        },
      },
      delivery: {
        delivery_type: '',
        delivery_params: {},
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {},
      },
    };

    handleDataToVisualReportSourceChange(reportDefinitionRequest);
    expect(
      reportDefinitionRequest.report_params.core_params.report_format
    ).toBe('pdf');
    expect(reportDefinitionRequest.report_params.core_params).toMatchObject({
      report_format: 'pdf',
    });
  });
});
