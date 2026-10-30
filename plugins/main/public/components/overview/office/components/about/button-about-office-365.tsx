import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_NAMES,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_CLOUD_SERVICES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutOffice365 = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.office365.aboutFlyout.title', {
      defaultMessage: 'About Office 365',
    })}
    testSubj='Office365'
    docsPath={DOCS_PATHS.office365}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.office365.aboutFlyout.overview', {
            defaultMessage:
              'Office 365 shows the security events of your Office 365 services.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.office365.aboutFlyout.dashboardTerm', {
          defaultMessage: 'Dashboard',
        }),
        description: i18n.translate(
          'wazuh.office365.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the Office 365 events of your environment.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.office365.aboutFlyout.panelTerm', {
          defaultMessage: 'Panel',
        }),
        description: i18n.translate(
          'wazuh.office365.aboutFlyout.panelDescription',
          {
            defaultMessage:
              'Lists the Office 365 events so that you can search, filter and inspect each one.',
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
        id: 'panel',
        tab: TAB_NAMES.panel,
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
          {i18n.translate('wazuh.office365.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your Office 365 services, then open the Panel tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.office365.aboutFlyout.howToStart1', {
            defaultMessage:
              'The Office 365 module has to be configured with the credentials of an application that can read the events of your tenant. The tabs stay empty until the first events are collected.',
          })}
        </p>
      </>
    }
  />
);
