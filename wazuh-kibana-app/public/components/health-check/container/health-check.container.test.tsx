/*
 * Wazuh app - Health Check Component - Test
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
import { mount, shallow } from 'enzyme';
import { HealthCheckTest } from './health-check.container';

jest.mock('../../../components/common/hooks', () => ({
  useAppConfig: () => ({
    isReady: true,
    isLoading: false,
    data: {
      'ip.selector': 1,
      'checks.metaFields': true,
      'checks.timerFilter': true,
      'checks.maxBuckets': true,
      'checks.api': true,
      'checks.setup': true,
      'checks.pattern': true,
      'checks.template': true,
      'checks.fields': true,
    },
  }),
  useRootScope: () => ({}),
}));

jest.mock('../services', () => ({
  checkPatternService: (appInfo) => () => undefined,
  checkTemplateService: (appInfo) => () => undefined,
  checkApiService: (appInfo) => () => undefined,
  checkSetupService: (appInfo) => () => undefined,
  checkFieldsService: (appInfo) => () => undefined,
  checkPluginPlatformSettings: (appInfo) => () => undefined,
  checkPatternSupportService: (appInfo) => () => undefined,
  checkIndexPatternService: (appInfo) => () => undefined,
}));

jest.mock('../components/check-result', () => ({
  CheckResult: () => () => <></>,
}));

jest.mock('../../../react-services', () => ({
  AppState: {
    setPatternSelector: () => {},
  },
  ErrorHandler: {
    handle: (error) => error,
  },
}));

jest.mock('../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: (str) => str,
    },
  }),
  getDataPlugin: () => ({
    query: {
      timefilter: {
        timefilter: {
          setTime: (time: number) => true,
        },
      },
    },
  }),
  getUiSettings: () => ({
    get: (setting: string): any => {
      if(setting === 'theme:darkMode'){
        return false
      }
    }
  })
}));

describe('Health Check container', () => {
  it('should render a Health check screen', () => {
    const component = shallow(<HealthCheckTest />);

    expect(component).toMatchSnapshot();
  });

  it('should render a Health check screen with error', () => {
    const component = mount(<HealthCheckTest />);

    component.find('CheckResult').at(1).invoke('handleErrors')('setup', ['Test error']); // invoke is wrapped with act to await for setState

    const callOutError = component.find('EuiCallOut');
    expect(callOutError.text()).toBe('[API version] Test error');
  });
});
