/*
 * Wazuh app - React Test component WzConfigurationOffice365
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { shallow } from 'enzyme';
import { WzConfigurationOffice365 } from './office365';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('../../../../../../kibana-services', () => ({
  getUiSettings: () => ({
    get: (uiSetting: string) => {
      if (uiSetting === 'theme:darkMode') {
        return false;
      }
    },
  }),
}));

const mockStore = configureMockStore();
const store = mockStore({});

// the jest.mock of @osd/monaco is added due to a problem transcribing the files to run the tests.
// https://github.com/wazuh/wazuh-dashboard-plugins/pull/6921#issuecomment-2298289550

jest.mock('@osd/monaco', () => ({
  monaco: {},
}));

describe('WzConfigurationOffice365 component', () => {
  it('renders correctly to match the snapshot', () => {
    const agent = { id: '000' };

    const wrapper = shallow(
      <Provider store={store}>
        <WzConfigurationOffice365
          currentConfig={'master-test-node'}
          agent={agent}
          updateBadge={() => {}}
          updateConfigurationSection={() => {}}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
