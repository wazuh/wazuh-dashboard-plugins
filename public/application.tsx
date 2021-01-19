import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppMountParameters, CoreStart } from 'kibana/public';
import { AppPluginStartDependencies } from './types';
import { I18nProvider } from '@kbn/i18n/react';
import store from './redux/store';
import { AppRouter } from './app-router';
import { KibanaContextProvider } from '../../../src/plugins/kibana_react/public';

import './styles';

export function renderApp(
  core: CoreStart,
  plugins: AppPluginStartDependencies,
  params: AppMountParameters
) {
  const deps = { core, plugins, params };
  
  ReactDOM.render(
    <Provider store={store}>
      <KibanaContextProvider services={deps}>
        <I18nProvider>
          <AppRouter {...deps}/>
        </I18nProvider>
      </KibanaContextProvider>
    </Provider>,
    params.element
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}