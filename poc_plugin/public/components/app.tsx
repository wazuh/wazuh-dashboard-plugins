import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { EmbeddableRenderer, ViewMode } from '../../../../src/plugins/embeddable/public';

import {
  EuiButton,
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiText,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { WazuhStart } from '../../../wazuh-kibana-app/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { DashboardStart } from '../../../../src/plugins/dashboard/public';
import { DataPublicPluginStart } from '../../../../src/plugins/data/public';
import { DashboardPage } from '../apps/metrics/views/dashboard/dashboard';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';

interface PocPluginAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  dashboard: DashboardStart;
  data: DataPublicPluginStart;
  wazuh: WazuhStart;
}

export const PocPluginApp = ({ basename, notifications, http, navigation, wazuh, dashboard, data }: PocPluginAppDeps) => {
  // Use React hooks to manage state.
  const [timestamp, setTimestamp] = useState<string | undefined>();

  const onClickHandler = () => {
    // Use the core http service to make a response to the server API.
    http.get('/api/poc_plugin/example').then((res) => {
      setTimestamp(res.time);
      // Use the core notifications service to display a success message.
      notifications.toasts.addSuccess(
        i18n.translate('pocPlugin.dataUpdated', {
          defaultMessage: 'Data updated',
        })
      );
    });
  };

  const { factories, AppMetrics } = wazuh;

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={true}
            useDefaultBehaviors={true}
          />
          <EuiPage restrictWidth="1000px">
            <EuiPageBody component="main">
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage
                      id="pocPlugin.helloWorldText"
                      defaultMessage="{name}"
                      values={{ name: PLUGIN_NAME }}
                    />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent>
                <EuiPageContentHeader>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage
                        id="pocPlugin.congratulationsTitle"
                        defaultMessage="Congratulations, you have successfully created a new OpenSearch Dashboards Plugin!"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EmbeddableRenderer input={{id:'1'}} factory={factories.getHelloWorldEmbeddableFactory()} />
                  <AppMetrics />
                  <DashboardPage plugins={{navigation, dashboard, data}}/>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
