import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutMicrosoftGraphApi = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.microsoftGraphApi.aboutFlyout.title', {
      defaultMessage: 'About Microsoft Graph API',
    })}
    testSubj='MicrosoftGraphApi'
    docsPath={DOCS_PATHS.microsoftGraphApi}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.microsoftGraphApi.aboutFlyout.overview', {
            defaultMessage:
              'Microsoft Graph API shows the security events of your Microsoft Graph services, collected directly from the Microsoft Graph API.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate(
          'wazuh.microsoftGraphApi.aboutFlyout.dashboardTerm',
          { defaultMessage: 'Dashboard' },
        ),
        description: i18n.translate(
          'wazuh.microsoftGraphApi.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the Microsoft Graph events of your environment.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.microsoftGraphApi.aboutFlyout.findingsTerm',
          { defaultMessage: 'Findings' },
        ),
        description: i18n.translate(
          'wazuh.microsoftGraphApi.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Lists the Microsoft Graph events so that you can search, filter and inspect each one.',
          },
        ),
      },
    ]}
    indices={[
      {
        id: 'dashboard',
        tab: TAB_VIEW_NAME_DASHBOARD,
        patterns: [WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN],
      },
      {
        id: 'findings',
        tab: TAB_VIEW_NAME_EVENTS,
        patterns: [WAZUH_FINDINGS_PATTERN],
      },
    ]}
    howToStart={
      <>
        <p>
          {i18n.translate('wazuh.microsoftGraphApi.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your Microsoft Graph services, then open the Findings tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.microsoftGraphApi.aboutFlyout.howToStart1', {
            defaultMessage:
              'The Microsoft Graph module has to be configured with the credentials of an application that can read the events. The tabs stay empty until the first events are collected.',
          })}
        </p>
      </>
    }
  />
);
