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

export const ButtonAboutGoogleCloud = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.googleCloud.aboutFlyout.title', {
      defaultMessage: 'About Google Cloud',
    })}
    testSubj='GoogleCloud'
    docsPath={DOCS_PATHS.googleCloud}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.googleCloud.aboutFlyout.overview', {
            defaultMessage:
              'Google Cloud shows the security events of your Google Cloud Platform services, collected directly from the GCP API.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.googleCloud.aboutFlyout.dashboardTerm', {
          defaultMessage: 'Dashboard',
        }),
        description: i18n.translate(
          'wazuh.googleCloud.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the Google Cloud events of your environment.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.googleCloud.aboutFlyout.findingsTerm', {
          defaultMessage: 'Findings',
        }),
        description: i18n.translate(
          'wazuh.googleCloud.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Lists the Google Cloud events so that you can search, filter and inspect each one.',
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
          {i18n.translate('wazuh.googleCloud.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your Google Cloud services, then open the Findings tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.googleCloud.aboutFlyout.howToStart1', {
            defaultMessage:
              'The Google Cloud module has to be configured with the subscription to read and its credentials. The tabs stay empty until the first events are collected.',
          })}
        </p>
      </>
    }
  />
);
