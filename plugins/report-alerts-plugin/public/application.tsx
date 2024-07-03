/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { ReportsDashboardsApp } from './components/app';

export const renderApp = (
  { notifications, http, chrome }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <ReportsDashboardsApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      chrome={chrome}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
