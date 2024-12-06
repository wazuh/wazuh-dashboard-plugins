/*
 * Wazuh app - React test for Export Table Csv component.
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
import { ExportTableCsv } from './export-table-csv';

const noop = () => {};

describe('Export Table Csv component', () => {
  it('renders correctly to match the snapshot when the button is disabled', () => {
    const wrapper = mount(
      <ExportTableCsv
        totalItems={0}
        showToast={noop}
        exportCSV={noop}
        fetchContext={{ endpoint: '', filters: {} }}
        title='example'
      />,
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('renders correctly to match the snapshot when the button is enabled', () => {
    const wrapper = mount(
      <ExportTableCsv
        totalItems={1}
        showToast={noop}
        exportCSV={noop}
        fetchContext={{ endpoint: '', filters: {} }}
        title='example'
      />,
    );

    expect(wrapper).toMatchSnapshot();
  });
});
