/*
 * Wazuh app - Health Check Component - Test
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { mount, shallow } from 'enzyme';
import { HealthCheck } from './health-check.container';

jest.mock('../../../react-services/error-handler', () => ({
  handle: (error) => error,
}));

jest.mock('../../../components/common/hooks/use-app-config', () => ({
  useAppConfig: () => ({
    isReady: true,
    isLoading: false,
    data: {
      'ip.selector': 1,
      'checks.metaFields': true,
      'checks.timerFilter': true,
      'checks.api': true,
      'checks.setup': true,
      'checks.pattern': true,
      'checks.template': true,
      'checks.fields': true,
    },
  }),
}));

jest.mock('../services', () => ({
  checkPatternService: () => ({ errors: [] }),
  checkTemplateService: () => ({ errors: [] }),
  checkApiService: () => ({ errors: [] }),
  checkSetupService: () => ({ errors: [] }),
  checkFieldsService: () => ({ errors: [] }),
  checkKibanaSettings: () => ({ errors: [] }),
  checkKibanaSettingsTimeFilter: () => ({ errors: [] }),
}));

jest.mock('../components/check-result', () => ({
  CheckResult: () => () => <></>,
}));

jest.mock('../../../react-services/app-state', () => ({
  setPatternSelector: () => {},
}));

jest.mock('../../../components/common/hooks/use-app-deps', () => ({
  useAppDeps: () => ({
    core: {
      http: {
        basePath: {
          prepend: (url) => url,
        },
      },
    },
  }),
}));

describe('Health Check container', () => {
  test('should render a Health check screen', () => {
    const component = shallow(<HealthCheck />);

    expect(component).toMatchSnapshot();
  });

  test('should render a Health check screen with error', () => {
    const component = mount(<HealthCheck />);

    component.find('CheckResult').at(1).invoke('handleErrors')(['test']); // invoke is wrapped with act to await for setState

    const callOutError = component.find('EuiCallOut');
    expect(callOutError.text()).toBe('test');
  });
});
