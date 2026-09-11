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

jest.mock('../../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
  getCookies: () => {
    return {
      get: () => 'test',
    };
  },
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

describe('Export Table Csv component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = mount(<ExportTableCsv />);
    expect(wrapper).toMatchSnapshot();
  });

  it('disables and shows a loading state on the button while isLoading is true, even when there are items to export', () => {
    const wrapper = mount(<ExportTableCsv totalItems={10} isLoading />);
    const button = wrapper.find('EuiButtonEmpty');

    expect(button.prop('isDisabled')).toBe(true);
    expect(button.prop('isLoading')).toBe(true);
  });

  it('enables the button when there are items to export and isLoading is false', () => {
    const wrapper = mount(<ExportTableCsv totalItems={10} isLoading={false} />);
    const button = wrapper.find('EuiButtonEmpty');

    expect(button.prop('isDisabled')).toBe(false);
    expect(button.prop('isLoading')).toBe(false);
  });
});
