/*
 * Wazuh app - React test for Stats component.
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
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Stats } from './stats';

jest.mock('../../../react-services/navigation-service', () => {
  return {
    getInstance() {
      return {
        getUrlForApp() {
          return '';
        },
        getHistory() {
          return {};
        },
      };
    },
  };
});

jest.mock('../../../components/common/hooks/use-user-is-admin', () => {
  return {
    useUserPermissionsIsAdminRequirements() {
      console.log('UserPermisionsIsAdmin');
      return ['', []];
    },
  };
});

jest.mock('../../../components/common/hooks/useUserPermissions', () => {
  return {
    useUserPermissionsRequirements() {
      console.log('UserPermisions');
      return [false, []];
    },
  };
});

jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

jest.mock('react-use/lib/useObservable', () => () => {});
jest.mock('./last-alerts-stat/last-alerts-service', () => ({
  getLast24HoursAlerts: jest.fn().mockReturnValue({
    count: 100,
    cluster: {
      field: 'cluster.name',
      name: 'master',
    },
    indexPatternId: 'wazuh-events-*',
  }),
}));

jest.mock('../../../kibana-services', () => ({
  getCore: jest.fn().mockReturnValue({
    application: {
      navigateToApp: () => 'http://url',
      getUrlForApp: () => 'http://url',
    },
    uiSettings: {
      get: () => true,
    },
  }),
  getCookies: jest.fn(() => {
    return {
      get: () => 'test',
    };
  }),
  getUiSettings: jest.fn(() => {
    return {
      get: () => 'test',
    };
  }),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

describe('Stats component', () => {
  test('renders correctly to match the snapshot', async () => {
    await act(async () => {
      const { container } = render(
        <Stats
          active={8}
          disconnected={0}
          never_connected={3}
          pending={0}
          total={11}
          error={null}
          isAgentsLoading={false}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
