import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { PocPluginApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation, wazuh, data, dashboard }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <PocPluginApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
      wazuh={wazuh}
      data={data}
      dashboard={dashboard}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
