import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { FleetManagement } from '../components';
import { getPlugins } from '../plugin-services';

export async function renderApp(params, { Layout }) {
  const deps = {
    /* coreStart, navigation, */ params /* config */,
    history,
  };
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
