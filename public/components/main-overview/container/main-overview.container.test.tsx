/*
 * Wazuh app - React component for main overview - Test
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { MainOverview } from './main-overview.container';

jest.mock('../../../react-services/app-state', () => ({
  getCurrentAPI: () => {
    id: 'default';
  },
  getExtensions: () => [],
}));

jest.mock('../../common/hocs/withGlobalBreadcrumb', () => {
  return {
    withGlobalBreadcrumb: () => {
      return (component) => {
        component.defaultProps = {
          ...component.defaultProps,
        };
        return component;
      };
    },
  };
});

jest.mock('../../common/hooks/agents/use-agents-summary', () => ({
  useAgentsSummary: () => [false, {}, undefined],
}));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../components/overview-welcome', () => ({
  OverviewWelcome: () => () => <></>,
}));

jest.mock('../components/overview-stats', () => ({
  OverviewStats: () => () => <></>,
}));

describe('Main overview container', () => {
  test('should render a Main overview screen', () => {
    const component = shallow(<MainOverview />);

    expect(component).toMatchSnapshot();
  });
});