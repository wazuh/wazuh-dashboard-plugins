import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { AppMountParameters, CoreStart } from 'kibana/public';
import { KibanaContextProvider } from '../../../src/plugins/kibana_react/public';
import { AppPluginStartDependencies } from './types';
import { I18nProvider } from '@kbn/i18n/react';
import store from './redux/store';
import { AppRouter } from './app-router';

export function renderApp(
  core: CoreStart,
  navigation: AppPluginStartDependencies,
  params: AppMountParameters
) {
  const deps = { core, navigation, params };

  //TODO load app confing into store

  ReactDOM.render(
    <Provider store={store}>
      <KibanaContextProvider {...deps}>
        <I18nProvider>
          <AppRouter />
        </I18nProvider>
      </KibanaContextProvider>
    </Provider>,
    params.element
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
