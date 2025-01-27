import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { Application } from './application';
import { Provider } from 'react-redux';
// import store from './redux/store';

export async function renderApp({ http, params }) {
  const deps = { http, params };

  ReactDOM.render(
    <I18nProvider>
      <Application {...deps} />
    </I18nProvider>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
