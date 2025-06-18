import React from 'react';
import { createHashHistory } from 'history';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { FleetManagement } from '../components';
import { getPlugins, getWazuhCore } from '../plugin-services';

export async function renderApp(params, { Layout }) {
  const deps = {
    params,
    history,
  };

  getWazuhCore().navigationService.getInstance(createHashHistory());

  const indexPattern =
    await getPlugins().data.indexPatterns.get('wazuh-agents*');

  ReactDOM.render(
    <I18nProvider>
      <Layout>
        <FleetManagement indexPatterns={indexPattern} filters={[]} {...deps} />
      </Layout>
    </I18nProvider>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
