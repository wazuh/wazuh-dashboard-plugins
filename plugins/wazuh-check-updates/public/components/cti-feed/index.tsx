import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import type {
  AppMountParameters,
  CoreStart,
} from 'opensearch-dashboards/public';
import type { CtiFeedLocationState } from '../../../common/cti-feed';
import { CtiFeedApp } from './cti-feed-app';
import './cti-feed.scss';

export const renderCtiFeedApp = (
  core: CoreStart,
  { element, history }: AppMountParameters,
) => {
  core.chrome.setBreadcrumbs([
    {
      text: i18n.translate('wazuhCheckUpdates.ctiFeed.page.breadcrumb', {
        defaultMessage: 'CTI feed',
      }),
    },
  ]);

  const state = history.location.state as CtiFeedLocationState | undefined;
  if (state?.openRegistration) {
    // Consumed once: a reload must not reopen the modal.
    history.replace({ ...history.location, state: undefined });
  }

  const root = createRoot(element);
  root.render(
    <I18nProvider>
      <CtiFeedApp openRegistration={Boolean(state?.openRegistration)} />
    </I18nProvider>,
  );

  return () => root.unmount();
};
