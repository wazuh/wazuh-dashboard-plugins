/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ReportDelivery } from '../delivery';
import httpClientMock from '../../../../../test/httpMockClient';
import { act } from 'react-dom/test-utils';

const emptyRequest = {
  report_params: {
    report_name: '',
    report_source: '',
    description: '',
    core_params: {
      base_url: '',
      report_format: '',
      time_duration: '',
    },
  },
  delivery: {
    configIds: [],
    title: '',
    textDescription: '',
    htmlDescription: ''
  },
  trigger: {
    trigger_type: '',
    trigger_params: {},
  },
  time_created: 0,
  last_updated: 0,
  status: '',
};

const timeRange = {
  timeFrom: new Date(1234567800),
  timeTo: new Date(1234567890),
};

global.fetch = jest.fn(() => ({
  then: jest.fn(() => ({
    then: jest.fn()
  }))
}));

describe('<ReportDelivery /> panel', () => {
  test('render create component', () => {
    const { container } = render(
      <ReportDelivery
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('render edit component', async () => {
    const promise = Promise.resolve();
    let editReportDefinitionRequest = {
      report_params: {
        report_name: 'edit cron schedule component',
        report_source: 'Dashboard',
        description: '',
        core_params: {
          base_url: '',
          report_format: '',
          header: '',
          footer: '',
          time_duration: '',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: ''
      },
      trigger: {
        trigger_type: 'On demand',
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition: editReportDefinitionRequest,
    });

    const { container } = render(
      <ReportDelivery
        edit={true}
        editDefinitionId={'1'}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });
});
