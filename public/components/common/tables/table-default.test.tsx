/*
 * Wazuh app - React test for table default component.
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
import { TableDefault } from './table-default';

jest.mock('../../../kibana-services', () => ({
  getAngularModule: jest.fn(),
  getHttp: () => ({
    basePath: {
      prepend: (str) => str,
    },
  }),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (options) => {},
  }),
}));

jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  })
);

const columns = [
  {
    field: 'version',
    name: 'Version',
    sortable: true,
    truncateText: true,
  },
  {
    field: 'architecture',
    name: 'Architecture',
    sortable: true,
  },
  {
    field: 'cve',
    name: 'CVE',
    sortable: true,
    truncateText: true,
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
  },
];

const tableProps = {
  onSearch: () => {},
  tableColumns: columns,
  tablePageSizeOptions: [15, 25, 50, 100],
  tableInitialSortingDirection: 'asc',
  tableInitialSortingField: '',
  tableProps: {},
  reload: () => {},
};

describe('Table Default component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = mount(<TableDefault {...tableProps} />);
    expect(wrapper).toMatchSnapshot();
  });
});
