/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ReportDetails } from '../report_details';
import propsMock from '../../../../../test/propsMock';
import httpClientMock from '../../../../../test/httpMockClient';
import 'babel-polyfill';
import { act } from 'react-dom/test-utils';

function setBreadcrumbs(array: []) {
  jest.fn();
}

describe('<ReportDetails /> panel', () => {
  const match = {
    params: {
      reportId: '1',
    },
  };

  test('render on-demand component', async () => {
    const promise = Promise.resolve();
    const report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Dashboard',
        description: '',
        core_params: {
          base_url: '',
          report_format: '',
          header: '',
          footer: '',
          time_duration: 'PT30M',
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
      report_definition,
      query_url: `http://localhost:5601/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(time:(from:'2020-10-23T20:53:35.315Z',to:'2020-10-23T21:23:35.316Z'))`,
      config_list: []
    });

    const { container } = render(
      <ReportDetails
        httpClient={httpClientMock}
        props={propsMock}
        match={match}
        setBreadcrumbs={setBreadcrumbs}
      />
    );
    await act(() => promise);
    await expect(container.firstChild).toMatchSnapshot();
  });

  test('render 5 hours recurring component', async () => {
    const promise = Promise.resolve();
    const report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Dashboard',
        description: '',
        core_params: {
          base_url: '',
          report_format: '',
          header: '',
          footer: '',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: ''
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          schedule: {
            interval: {
              period: 5,
              unit: 'HOURS',
              timezone: 'PST8PDT',
            },
          },
          enabled_time: 1114939203,
          enabled: true,
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      query_url: `http://localhost:5601/app/dashboards#/view/7adfa750-4c81-11e8-b3d7-01146121b73d?_g=(time:(from:'2020-10-23T20:53:35.315Z',to:'2020-10-23T21:23:35.316Z'))`,
      config_list: []
    });

    const { container } = render(
      <ReportDetails
        httpClient={httpClientMock}
        props={propsMock}
        match={match}
        setBreadcrumbs={setBreadcrumbs}
      />
    );
    await act(() => promise);
    await expect(container.firstChild).toMatchSnapshot();
  });
});
