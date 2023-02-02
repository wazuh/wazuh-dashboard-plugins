import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { AppPluginStartDependencies, ClientConfigType } from './types';
import { AppRouter } from './app-router';

export function renderApp(
  coreStart: CoreStart,
  params: AppMountParameters,
) {
  const deps = { coreStart, params };
  ReactDOM.render(
    <I18nProvider>
      <AppRouter {...deps} />
    </I18nProvider>,
    params.element
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}


