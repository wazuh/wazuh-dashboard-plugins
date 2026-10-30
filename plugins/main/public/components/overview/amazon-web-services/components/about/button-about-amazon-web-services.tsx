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

export const ButtonAboutAmazonWebServices = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.amazonWebServices.aboutFlyout.title', {
      defaultMessage: 'About Amazon Web Services',
    })}
    testSubj='AmazonWebServices'
    docsPath={DOCS_PATHS.amazonWebServices}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.amazonWebServices.aboutFlyout.overview', {
            defaultMessage:
              'Amazon Web Services shows the security events of your Amazon AWS services, collected directly from the AWS API.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate(
          'wazuh.amazonWebServices.aboutFlyout.dashboardTerm',
          { defaultMessage: 'Dashboard' },
        ),
        description: i18n.translate(
          'wazuh.amazonWebServices.aboutFlyout.dashboardDescription',
          {
            defaultMessage: 'A summary of the AWS events of your environment.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.amazonWebServices.aboutFlyout.findingsTerm',
          { defaultMessage: 'Findings' },
        ),
        description: i18n.translate(
          'wazuh.amazonWebServices.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Lists the AWS events so that you can search, filter and inspect each one.',
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
          {i18n.translate('wazuh.amazonWebServices.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your AWS services, then open the Findings tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.amazonWebServices.aboutFlyout.howToStart1', {
            defaultMessage:
              'The AWS module has to be configured with the services to monitor and credentials that can read them. The tabs stay empty until the first logs are collected.',
          })}
        </p>
      </>
    }
  />
);
