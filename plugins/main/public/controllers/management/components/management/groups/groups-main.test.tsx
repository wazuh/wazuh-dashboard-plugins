/*
 * Wazuh app - React test for Group-Main component.
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
import { shallow } from 'enzyme';
import WzGroups from './groups-main';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('../../../../../kibana-services', () => ({
  getAngularModule: jest.fn(),
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
}));

const mockProps = {
  section: 'groups',
  configurationProps: {
    agent: {
      id: '000',
    },
  },
  logtestProps: {
    showClose: true,
    onFlyout: true,
  },
  state: {
    section: '',
  },
};
const mockStore = configureMockStore();
const store = mockStore({});

describe('Group main component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <WzGroups {...mockProps} />
      </Provider>,
    );

    expect(wrapper).toMatchSnapshot();
  });
});
