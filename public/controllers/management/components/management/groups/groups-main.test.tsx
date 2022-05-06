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
      prepend: (str) => str,
    },
  }),
}));

const mockProps = {
  section: 'groups',
  groupsProps: {
    items: [
      {
        name: 'default',
        count: 1,
        mergedSum: '2c45c95db2954d2c7d0ea533f09e81a5',
        configSum: 'ab73af41699f13fdd81903b5f23d8d00',
      },
    ],
    closeAddingAgents: false,
    exportConfigurationProps: {
      type: 'group',
    },
    selectedGroup: false,
  },
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
  clusterStatus: {
    status: true,
    contextConfigServer: 'cluster',
  },
};
const mockStore = configureMockStore();
const store = mockStore({});

describe('Group main component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <WzGroups {...mockProps} />
      </Provider>
    );

    expect(wrapper).toMatchSnapshot();
  });
});
