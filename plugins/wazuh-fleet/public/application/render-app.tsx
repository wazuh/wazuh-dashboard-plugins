import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { FleetManagement } from '../components';
import { getPlugins } from '../plugin-services';
import { DataSourceAdapter } from '../services/data-source-adapter';

export async function renderApp(params) {
  const deps = {
    /* coreStart, navigation, */ params /* config */,
    history,
  };
  const dataSourceAdapter = new DataSourceAdapter(getPlugins());
  const dataSource = await dataSourceAdapter.getIndexPattern();

  ReactDOM.render(
    <I18nProvider>
      <FleetManagement {...dataSource} {...deps} />
    </I18nProvider>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
