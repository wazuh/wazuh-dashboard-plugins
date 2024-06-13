/*
 * Wazuh app - React test for Status component.
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
import WzStatus from './status-main';
import { renderWithProviders } from '../../../../../redux/render-with-redux-provider';

jest.mock('../../../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
  getUiSettings: () => ({
    get: (setting: string): any => {
      if (setting === 'theme:darkMode') {
        return false;
      }
    },
  }),
}));

describe('Status component', () => {
  it('renders correctly to match the snapshot', () => {
    const { container } = renderWithProviders(<WzStatus />);
    expect(container).toMatchSnapshot();
  });
});
