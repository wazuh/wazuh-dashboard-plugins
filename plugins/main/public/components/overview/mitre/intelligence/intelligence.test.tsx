/*
 * Wazuh app - ModuleMitreAttackIntelligence Component - Test
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
import { render } from 'enzyme';
import { ModuleMitreAttackIntelligence } from './intelligence';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../../../common/hooks/use-app-config', () => ({
  useAppConfig: () => ({
    isReady: true,
    isLoading: false,
    data: {
      'reports.csv.maxRows': 10000,
    },
  }),
}));
jest.mock(
  '../../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

jest.mock('../../../../react-services', () => ({
  WzRequest: () => ({
    apiReq: (method: string, path: string, params: any) => {
      return {
        data: {
          data: {
            affected_items: [],
          },
        },
      };
    },
  }),
}));

// added to remove useLayoutEffect warning
jest.mock('react', () => ({
  ...(jest.requireActual('react') as object),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

jest.mock('../../../../react-services/navigation-service', () => ({
  getInstance() {
    return {
      getLocation: () => {
        return { search: '?tabRedirect=groups' };
      },
      getParams: () => {
        return {
          has: () => 'groups',
        };
      },
    };
  },
}));

const mockStore = configureMockStore();

describe('Module Mitre Att&ck intelligence container', () => {
  it('should render the component if has permissions', () => {
    const store = mockStore({
      appStateReducers: {
        userAccount: {
          administrator: true,
        },
        withUserLogged: true,
        userPermissions: {
          'mitre:read': { '*:*:*': 'allow' },
        },
      },
    });
    const component = render(
      <Provider store={store}>
        <ModuleMitreAttackIntelligence />
      </Provider>,
    );
    expect(component).toMatchSnapshot();
  });

  it('should render permissions prompt when no has permissions', () => {
    const store = mockStore({
      appStateReducers: {
        userAccount: {
          administrator: true,
        },
        withUserLogged: true,
        userPermissions: {
          'mitre:read': { '*:*:*': 'deny' },
        },
      },
    });
    const component = render(
      <Provider store={store}>
        <ModuleMitreAttackIntelligence />
      </Provider>,
    );
    expect(component).toMatchSnapshot();
  });
});
