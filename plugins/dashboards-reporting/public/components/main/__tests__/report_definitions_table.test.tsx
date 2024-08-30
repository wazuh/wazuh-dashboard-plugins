/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ReportDefinitions } from '../report_definitions_table';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [8, 10, 13],
};

describe('<ReportDefinitions /> panel', () => {
  configure({ adapter: new Adapter() });
  test('render component', () => {
    let reportDefinitionsTableContent = [
      {
        reportName: 'test report name',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
      {
        reportName: 'test report name 2',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
    ];
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={reportDefinitionsTableContent}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('render empty table', () => {
    const { container } = render(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={[]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('test click on report definition row', async () => {
    window = Object.create(window);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        assign: jest.fn(),
      },
    });
    let promise = Promise.resolve();
    let reportDefinitionsTableContent = [
      {
        reportName: 'test report name',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
      {
        reportName: 'test report name 2',
        type: 'Download',
        owner: 'davidcui',
        source: 'Dashboard',
        lastUpdated: 'test updated time',
        details: '',
        status: 'Created',
      },
    ];

    const component = mount(
      <ReportDefinitions
        pagination={pagination}
        reportDefinitionsTableContent={reportDefinitionsTableContent}
      />
    );

    const nameLink = component.find('button').at(3);
    nameLink.simulate('click');
  });
});
