import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from 'kibana/public';
import { AppPluginStartDependencies } from './types';

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {

  ReactDOM.render(
    <div>
      Hello world!
    </div>,
    element
  )

  return () => ReactDOM.unmountComponentAtNode(element);
}
