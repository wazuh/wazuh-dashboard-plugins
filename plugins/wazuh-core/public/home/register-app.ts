// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch_dashboards/public';

export function registerHomeApp(deps: { core: any }) {
  const { http } = deps.core;

  deps.core.application.register({
    id: 'wz-home-core',
    title: 'Overview',
    order: '1',
    mount: async (params: AppMountParameters) => {
      try {
        const { renderApp } = await import('./render-app');

        params.element.classList.add('dscAppWrapper', 'wz-app');

        const unmount = await renderApp({ http, params });

        return () => {
          unmount();
        };
      } catch (error) {
        console.debug(error);
      }
    },
    category: {
      id: 'wz-category-home-core',
      label: i18n.translate('wz-app-category-home-core', {
        defaultMessage: 'Home',
      }),
      order: 0,
      euiIconType: 'appSearchApp',
    },
  });
}
