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

jest.mock('../../../react-services/navigation-service', () => ({
  getInstance() {
    return {
      getUrlForApp(appID) {
        return appID;
      },
    };
  },
}));

// the jest.mock of @osd/monaco is added due to a problem transcribing the files to run the tests.
// https://github.com/wazuh/wazuh-dashboard-plugins/pull/6921#issuecomment-2298289550

jest.mock('@osd/monaco', () => ({
  monaco: {},
}));

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
  useRouterSearch: () => ({}),
}));

jest.mock('../services', () => ({
  checkPatternService: appInfo => () => {},
  checkTemplateService: appInfo => () => {},
  checkApiService: appInfo => () => {},
  checkSetupService: appInfo => () => {},
  checkFieldsService: appInfo => () => {},
  checkPluginPlatformSettings: appInfo => () => {},
  checkPatternSupportService: appInfo => () => {},
  checkIndexPatternService: appInfo => () => {},
}));

jest.mock('../components/check-result', () => ({
  CheckResult: () => <></>,
}));

jest.mock('../../../react-services', () => ({
  AppState: {},
  ErrorHandler: {
    handle: error => error,
  },
}));

jest.mock('react-use/lib/useObservable', () => () => {});

jest.mock('../../../kibana-services', () => ({
  getCore: () => ({
    application: {
      getUrlForApp: (appId: string) => appId,
      navigateToUrl: (appId: string) => appId,
    },
  }),
  getHttp: () => ({
    basePath: {
      prepend: str => str,
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
      if (setting === 'theme:darkMode') {
        return false;
      }
    },
  }),
}));

describe('Health Check container', () => {
  it('should render a Health check screen', () => {
    const component = shallow(<HealthCheckTest />);

    expect(component).toMatchSnapshot();
  });

  it('should render a Health check screen with error', () => {
    const component = mount(<HealthCheckTest />);

    component.find('CheckResult').at(1).invoke('handleErrors')('setup', [
      'Test error',
    ]); // invoke is wrapped with act to await for setState

    const callOutError = component.find('EuiCallOut');

    expect(callOutError.text()).toBe('[API version] Test error');
  });

  it('should render a Health check screen with warning', () => {
    const component = mount(<HealthCheckTest />);

    component.find('CheckResult').at(1).invoke('handleWarnings')('setup', [
      'Test warning',
    ]);

    const callOutWarning = component.find('EuiCallOut');

    expect(callOutWarning.text()).toBe('[API version] Test warning');
  });
});
