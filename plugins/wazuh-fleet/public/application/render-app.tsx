import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { FleetManagement } from '../components';

export async function renderApp(params) {
  const deps = { /* coreStart, navigation, */ params /* config */, history };

  ReactDOM.render(
    <I18nProvider>
      <FleetManagement {...deps} />
    </I18nProvider>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
