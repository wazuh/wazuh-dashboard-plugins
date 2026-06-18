import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '@osd/i18n/react';
import { Application } from './app-router';
import { Provider } from 'react-redux';
import store from './redux/store';

export async function renderApp(params) {
  /*
  TODO: Analyze whether this asynchronous import is correct await import('./app'); inside the renderApp function. This can cause problems if the ./app module is required for other modules or components that are used before the import is complete. If the ./app module contains critical logic, it might be better to import it at the beginning of the file synchronously or handle the import logic differently.
  */
  await import('./app');
  const deps = { /*coreStart, navigation, */ params /*config */ };
  const root = createRoot(params.element);
  root.render(
    <I18nProvider>
      <Provider store={store}>
        <Application {...deps} />
      </Provider>
    </I18nProvider>,
  );
  return () => root.unmount();
}
