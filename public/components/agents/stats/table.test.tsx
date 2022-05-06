/*
 * Wazuh app - React test for Ruleset component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React from 'react';
import { mount } from 'enzyme';
import { AgentStatTable } from './table';

jest.mock('../../../kibana-services', () => ({
  getAngularModule: jest.fn(),
  getHttp: () => ({
    basePath: {
      prepend: (str) => str,
    },
  }),
}));
jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

const tableColumns = [
  {
    field: 'location',
    name: 'Location',
    sortable: true,
  },
  {
    field: 'events',
    name: 'Events',
    sortable: true,
  },
  {
    field: 'bytes',
    name: 'Bytes',
    sortable: true,
  },
];

describe('AgentStatTable component', () => {
  it('Renders correctly to match the snapshot', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={false}
        start={''}
        end={''}
        title="Test"
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('Should return loading in process', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={true}
        start={''}
        end={''}
        title="Test"
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />
    );

    expect(wrapper.find('EuiLoadingSpinner').exists()).toBeTruthy();
    expect(wrapper.find('EuiLoadingSpinner').first().prop('size')).toBe('s');
  });

  it('Checking onClick event', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={true}
        start={''}
        end={''}
        title="Test"
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />
    );

    const mockOnClick = jest.fn();
    wrapper.find('EuiButtonEmpty').props().onClick = mockOnClick;
    // @ts-ignore
    wrapper.find('EuiButtonEmpty').props().onClick();
    expect(mockOnClick).toHaveBeenCalled();
  });
});
