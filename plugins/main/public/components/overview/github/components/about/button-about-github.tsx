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

export const ButtonAboutGitHub = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.github.aboutFlyout.title', {
      defaultMessage: 'About GitHub',
    })}
    testSubj='GitHub'
    docsPath={DOCS_PATHS.github}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.github.aboutFlyout.overview', {
            defaultMessage:
              'GitHub shows the events from the audit logs of your GitHub organizations.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.github.aboutFlyout.dashboardTerm', {
          defaultMessage: 'Dashboard',
        }),
        description: i18n.translate(
          'wazuh.github.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the audit events of your organizations.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.github.aboutFlyout.panelTerm', {
          defaultMessage: 'Panel',
        }),
        description: i18n.translate(
          'wazuh.github.aboutFlyout.panelDescription',
          {
            defaultMessage:
              'Lists the audit events so that you can search, filter and inspect each one.',
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
          {i18n.translate('wazuh.github.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your organizations, then open the Panel tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.github.aboutFlyout.howToStart1', {
            defaultMessage:
              'The GitHub module has to be configured with the organizations to monitor and a token that can read their audit logs. The tabs stay empty until the first events are collected.',
          })}
        </p>
      </>
    }
  />
);
