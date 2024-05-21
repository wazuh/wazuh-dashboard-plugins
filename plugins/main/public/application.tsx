import React from 'react';
import ReactDOM from 'react-dom';
import { I18nProvider } from '@osd/i18n/react';
import { Application } from './app-router';
import { Provider } from 'react-redux';
import store from './redux/store';
import { setHistory } from './kibana-services';

export async function renderApp(params) {
  /*
  TODO: Analyze whether this asynchronous import is correct await import('./app'); inside the renderApp function. This can cause problems if the ./app module is required for other modules or components that are used before the import is complete. If the ./app module contains critical logic, it might be better to import it at the beginning of the file synchronously or handle the import logic differently.
  */
  await import('./app');
  setHistory(params.history);
  const deps = { /*coreStart, navigation, */ params /*config */ };
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
