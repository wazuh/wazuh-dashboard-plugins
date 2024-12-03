import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiSmallButton,
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
// import { Route, Switch, Redirect } from 'react-router-dom';
import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { Steps } from './steps';
import { PLUGIN_ID, PLUGIN_NAME } from '../../common';
import { FlyoutForm } from './flyout';

interface WazuhRulesetAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}


const views = [
  {
    name: 'Integrations',
    id: 'integrations',
    hasDetailsRoute: true,
    render: (props: any) => <div>Integrations</div>,
  },
  {
    name: 'Rules',
    id: 'rules',
    hasDetailsRoute: true,
    render: (props: any) => <div>Rules</div>,
  },
  {
    name: 'Decoders',
    id: 'decoders',
    render: (props: any) => <div>Decoders</div>,
  },
  {
    name: 'KVDB',
    id: 'kvdb',
    render: () => <div>KVDBs</div>,
  },
];

export const WazuhRulesetApp = ({
  basename,
  notifications,
  http,
  navigation,
}: WazuhRulesetAppDeps) => {
  // Use React hooks to manage state.
  const [timestamp, setTimestamp] = useState<string | undefined>();

  const onClickHandler = () => {
    // Use the core http service to make a response to the server API.
    http.get('/api/wazuh-ruleset/example').then((res) => {
      setTimestamp(res.time);
      // Use the core notifications service to display a success message.
      notifications.toasts.addSuccess(
        i18n.translate('wazuhRuleset.dataUpdated', {
          defaultMessage: 'Data updated',
        })
      );
    });
  };

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <EuiPage restrictWidth="1000px">
            <EuiPageBody component="main">
              <Steps />
              <FlyoutForm title={"Metadata"}/>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
