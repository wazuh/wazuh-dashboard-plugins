import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiText,
  EuiButton,
} from '@elastic/eui';
import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { PLUGIN_ID, PLUGIN_NAME } from '../../common';

interface WazuhSecurityPoliciesAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

export const WazuhSecurityPoliciesApp = ({
  basename,
  notifications,
  http,
  navigation,
}: WazuhSecurityPoliciesAppDeps) => {
  // Use React hooks to manage state.
  const [timestamp, setTimestamp] = useState<string | undefined>();

  const onClickHandler = () => {
    // Use the core http service to make a response to the server API.
    http.get('/api/wazuh_security_policies/example').then(res => {
      setTimestamp(res.time);
      // Use the core notifications service to display a success message.
      notifications.toasts.addSuccess(
        i18n.translate('wazuhSecurityPolicies.dataUpdated', {
          defaultMessage: 'Data updated',
        }),
      );
    });
  };

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
          <EuiPage restrictWidth='1000px'>
            <EuiPageBody component='main'>
              <EuiPageHeader>
                <EuiTitle size='l'>
                  <h1>
                    <FormattedMessage
                      id='wazuhSecurityPolicies.helloWorldText'
                      defaultMessage='{name}'
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
                        id='wazuhSecurityPolicies.congratulationsTitle'
                        defaultMessage='Congratulations, you have successfully created a new OpenSearch Dashboards Plugin!'
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EuiText>
                    <p>
                      <FormattedMessage
                        id='wazuhSecurityPolicies.content'
                        defaultMessage='Look through the generated code and check out the plugin development documentation.'
                      />
                    </p>
                    <EuiHorizontalRule />
                    <p>
                      <FormattedMessage
                        id='wazuhSecurityPolicies.timestampText'
                        defaultMessage='Last timestamp: {time}'
                        values={{ time: timestamp ?? 'Unknown' }}
                      />
                    </p>
                    <EuiButton type='primary' size='s' onClick={onClickHandler}>
                      <FormattedMessage
                        id='wazuhSecurityPolicies.buttonText'
                        defaultMessage='Get data'
                      />
                    </EuiButton>
                  </EuiText>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
