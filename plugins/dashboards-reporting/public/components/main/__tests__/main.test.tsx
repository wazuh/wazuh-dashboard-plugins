/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Main } from '../main';
import httpClientMock from '../../../../test/httpMockClient';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';

function setBreadcrumbs(array: []) {
  jest.fn();
}

describe('<Main /> panel', () => {
  configure({ adapter: new Adapter() });
  test('render component', (done) => {
    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
        href: 'reports-dashboards#/',
      },
    });

    const { container } = render(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );

    expect(container.firstChild).toMatchSnapshot();
    done();
  });

  test('render component after create success', async () => {
    delete window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
        href: 'reports-dashboards#/create=success',
      },
    });

    const { container } = render(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('render component after edit success', async () => {
    delete window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
        href: 'reports-dashboards#/edit=success',
      },
    });

    const { container } = render(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  test('render component after delete success', async () => {
    delete window.location; 

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
        href: 'reports-dashboards#/delete=success',
      },
    });

    const { container } = render(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );

    expect(container.firstChild).toMatchSnapshot();
  })

  test('test refresh reports definitions button', async () => {
    const promise = Promise.resolve();
    const data = [
      {
        _id: 'abcdefg',
        _source: {
          query_url: '/app/visualize/edit/1234567890',
          state: 'Created',
          time_created: 123456789,
          time_from: 123456789,
          time_to: 1234567890,
          report_definition: {
            report_params: {
              report_name: 'test create report definition trigger',
              report_source: 'Dashboard',
              description: '',
              core_params: {
                base_url: 'http://localhost:5601',
                report_format: 'png',
                header: '',
                footer: '',
                time_duration: 'PT30M',
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
          },
        },
      },
    ];

    httpClientMock.get = jest.fn().mockResolvedValue({
      data,
    });

    const component = mount(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );
    await act(() => promise);

    const generate = component.find('button').at(7);
    generate.simulate('click');
    await act(() => promise);
  });

  test('test refresh reports table button', async () => {
    const promise = Promise.resolve();
    const data = [
      {
        _id: 'abcdefg',
        _source: {
          query_url: '/app/visualize/edit/1234567890',
          state: 'Created',
          time_created: 123456789,
          time_from: 123456789,
          time_to: 1234567890,
          report_definition: {
            report_params: {
              report_name: 'test create report definition trigger',
              report_source: 'Dashboard',
              description: '',
              core_params: {
                base_url: 'http://localhost:5601',
                report_format: 'png',
                header: '',
                footer: '',
                time_duration: 'PT30M',
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
          },
        },
      },
    ];

    httpClientMock.get = jest.fn().mockResolvedValue({
      data,
    });

    const component = mount(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );
    await act(() => promise);

    const generate = component.find('button').at(0);
    generate.simulate('click');
    await act(() => promise);
  });

  // TODO: mock catch() error response to contain status code 
  test.skip('test error toasts posted', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {}); // silence console log error from main
    const promise = Promise.resolve();

    httpClientMock.get = jest.fn().mockResolvedValue({
      response: null,
    });

    const component = mount(
      <Main httpClient={httpClientMock} setBreadcrumbs={setBreadcrumbs} />
    );
    const generate = component.find('button').at(7);
    try {
      generate.simulate('click');
      await act(() => promise);
    } catch (e) {
      await act(() => promise);
    }
  });
});
