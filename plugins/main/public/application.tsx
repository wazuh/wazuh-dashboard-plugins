import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { Application } from './app-router';
import { Provider } from 'react-redux';
import store from './redux/store';
import { createHashHistory } from 'history';

export async function renderApp(params) {
  await import('./app');
  const history = createHashHistory();
  const deps = { /*coreStart, navigation, */ params /*config */, history };
  ReactDOM.render(
    <I18nProvider>
      <Provider store={store}>
        <Application {...deps} />
      </Provider>
    </I18nProvider>,
    params.element,
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
