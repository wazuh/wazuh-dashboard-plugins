/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ReportSettings } from '../report_settings';
import 'regenerator-runtime';
import httpClientMock from '../../../../../test/httpMockClient';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
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
    htmlDescription: '',
  },
  trigger: {
    trigger_type: '',
    trigger_params: {},
  },
  time_created: 0,
  last_updated: 0,
  status: '',
};

let timeRange = {
  timeFrom: new Date(123456789),
  timeTo: new Date(1234567890),
};

const dashboardHits = {
  hits: [
    {
      _id: 'dashboard:abcdefghijklmnop12345',
      _source: {
        dashboard: {
          description: 'mock dashboard value',
          hits: 0,
          timeFrom: 'now-24h',
          timeTo: 'now',
          title: 'Mock Dashboard',
        },
        notebook: {
          name: 'mock notebook name',
        },
      },
    },
  ],
};

const visualizationHits = {
  hits: [
    {
      _id: 'visualization:abcdefghijklmnop12345',
      _source: {
        visualization: {
          description: 'mock visualization value',
          title: 'Mock Visualization',
        },
        notebook: {
          name: 'mock notebook name',
        },
      },
    },
  ],
};

const savedSearchHits = {
  hits: [
    {
      _id: 'search:abcdefghijklmnop12345',
      _source: {
        search: {
          title: 'Mock saved search value',
        },
        notebook: {
          name: 'mock notebook name',
        },
      },
    },
  ],
};

describe('<ReportSettings /> panel', () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  configure({ adapter: new Adapter() });
  test('render component', () => {
    const { container } = render(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('render edit, dashboard source', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Dashboard',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601/dashboard/abcdefghijklmnop12345',
          report_format: 'pdf',
          header: 'header content',
          footer: 'footer content',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: dashboardHits,
    });

    const { container } = render(
      <ReportSettings
        edit={true}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('render edit, visualization source', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Visualization',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601/edit/abcdefghijklmnop12345',
          report_format: 'png',
          header: 'header content',
          footer: 'footer content',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: visualizationHits,
    });

    const { container } = render(
      <ReportSettings
        edit={true}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('render edit, saved search source', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601/discover/abcdefghijklmnop12345',
          report_format: 'csv',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
          saved_search_id: 'abcdefghijk',
          limit: 10000,
          excel: true,
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: savedSearchHits,
    });

    const { container } = render(
      <ReportSettings
        edit={true}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('render edit, dashboard source', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601',
          report_format: 'csv',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
          saved_search_id: 'abcdefghijk',
          limit: 10000,
          excel: true,
        },
      },
      delivery: {
        delivery_type: '',
        delivery_params: {},
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: dashboardHits,
    });

    const { container } = render(
      <ReportSettings
        edit={true}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('render edit, visualization source', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601',
          report_format: 'csv',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
          saved_search_id: 'abcdefghijk',
          limit: 10000,
          excel: true,
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: visualizationHits,
    });

    const { container } = render(
      <ReportSettings
        edit={true}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('dashboard create from in-context', async () => {
    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost:5601/app/reports-alerts#/create?previous=dashboard:abcdefghijklmnop12345?timeFrom=2020-10-26T20:52:56.382Z?timeTo=2020-10-27T20:52:56.384Z',
      },
    });

    const promise = Promise.resolve();

    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Dashboard',
        description: '',
        core_params: {
          base_url: 'http://localhost:5601/dashboard/abcdefghijklmnop12345',
          report_format: 'png',
          header: '',
          footer: '',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: dashboardHits,
    });

    const { container } = render(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('visualization create from in-context', async () => {
    // @ts-ignore
    delete window.location; // reset window.location.href for in-context testing

    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost:5601/app/reports-alerts#/create?previous=visualize:abcdefghijklmnop12345?timeFrom=2020-10-26T20:52:56.382Z?timeTo=2020-10-27T20:52:56.384Z',
      },
    });

    const promise = Promise.resolve();

    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Visualization',
        description: '',
        core_params: {
          base_url: 'http://localhost:5601/edit/abcdefghijklmnop12345',
          report_format: 'pdf',
          header: '',
          footer: '',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: visualizationHits,
    });

    const { container } = render(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('saved search create from in-context', async () => {
    // @ts-ignore
    delete window.location; // reset window.location.href for in-context testing

    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:5601/app/reports-alerts#/create?previous=discover:abcdefghijklmnop12345?timeFrom=2020-10-26T20:52:56.382Z?timeTo=2020-10-27T20:52:56.384Z',
      },
    });

    const promise = Promise.resolve();

    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: '',
        core_params: {
          base_url: 'http://localhost:5601/discover/abcdefghijklmnop12345',
          report_format: 'csv',
          header: '',
          footer: '',
          time_duration: 'PT30M',
          saved_search_id: 'abcdefghijk',
          limit: 10000,
          excel: true,
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {},
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: savedSearchHits,
    });

    const { container } = render(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });

  test('simulate click on dashboard combo box', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601',
          report_format: 'csv',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
          saved_search_id: 'abcdefghijk',
          limit: 10000,
          excel: true,
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: dashboardHits,
    });

    const component = shallow(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />,
      { disableLifecycleMethods: true }
    );
    await act(() => promise);

    const comboBox = component.find('EuiComboBox').at(0);
    comboBox.simulate('change', [{ value: 'test', label: 'test' }]);

    await act(() => promise);
  });

  test('simulate click on visualization combo box', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Visualization',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601',
          report_format: 'pdf',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: visualizationHits,
    });

    const component = mount(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );
    await act(() => promise);

    const reportSourceRadio = component.find('EuiRadioGroup').at(0);
    const visualizationRadio = reportSourceRadio.find('EuiRadio').at(1);

    visualizationRadio
      .find('input')
      .simulate('change', 'visualizationReportSource');
    await act(() => promise);
    const comboBox = component.find('EuiComboBox').at(0);

    act(() => {
      comboBox.props().onChange([{ value: 'test', label: 'test' }]);
    });
    component.update();

    await act(() => promise);
  });

  test('simulate click on saved search combo box', async () => {
    const promise = Promise.resolve();
    let report_definition = {
      report_params: {
        report_name: 'test create report definition trigger',
        report_source: 'Saved search',
        description: 'test description',
        core_params: {
          base_url: 'http://localhost:5601',
          report_format: 'pdf',
          header: 'test header content',
          footer: 'test footer content',
          time_duration: 'PT30M',
        },
      },
      delivery: {
        configIds: [],
        title: '',
        textDescription: '',
        htmlDescription: '',
      },
      trigger: {
        trigger_type: 'Schedule',
        trigger_params: {
          schedule_type: 'Recurring',
          enabled: false,
          enabled_time: 1234567890,
          schedule: {
            interval: {
              period: 1,
              start_time: 123456789,
              unit: 'Days',
            },
          },
        },
      },
    };

    httpClientMock.get = jest.fn().mockResolvedValue({
      report_definition,
      hits: savedSearchHits,
    });

    const component = mount(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={false}
        showTimeRangeError={false}
      />
    );
    await act(() => promise);

    const reportSourceRadio = component.find('EuiRadioGroup').at(0);
    const visualizationRadio = reportSourceRadio.find('EuiRadio').at(2);

    visualizationRadio
      .find('input')
      .simulate('change', 'savedSearchReportSource');
    await act(() => promise);
    const comboBox = component.find('EuiComboBox').at(0);

    act(() => {
      comboBox.props().onChange([{ value: 'test', label: 'test' }]);
    });
    component.update();

    await act(() => promise);
  });

  test('display errors on create', async () => {
    const promise = Promise.resolve();
    const { container } = render(
      <ReportSettings
        edit={false}
        reportDefinitionRequest={emptyRequest}
        httpClientProps={httpClientMock}
        timeRange={timeRange}
        showSettingsReportNameError={true}
        showTimeRangeError={true}
      />
    );

    expect(container.firstChild).toMatchSnapshot();
    await act(() => promise);
  });
});
