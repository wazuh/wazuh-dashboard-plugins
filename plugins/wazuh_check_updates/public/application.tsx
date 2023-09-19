import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { AppPluginStartDependencies } from './types';
import { WazuhCheckUpdatesApp } from './components/app';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <WazuhCheckUpdatesApp
      basename={appBasePath}
      notifications={notifications}
      http={http}
      navigation={navigation}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
