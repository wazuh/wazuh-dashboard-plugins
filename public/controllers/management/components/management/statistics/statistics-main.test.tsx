/*
 * Wazuh app - React test for Statistics component.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import WzStatistics from './statistics-main';

jest.mock('../../../../../kibana-services', () => ({
  getAngularModule: jest.fn(),
  getHttp: () => ({
    basePath: {
      prepend: (str) => str,
    },
  }),
}));

jest.mock('react');
const mockStore = configureMockStore();
const store = mockStore({});

describe('Statistics component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <WzStatistics />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
