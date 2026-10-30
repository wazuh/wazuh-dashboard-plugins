import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutThreatHunting = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.threatHunting.aboutFlyout.title', {
      defaultMessage: 'About Threat Hunting',
    })}
    testSubj='ThreatHunting'
    docsPath={DOCS_PATHS.threatHunting}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.threatHunting.aboutFlyout.overview', {
            defaultMessage:
              'Threat Hunting lets you browse the security events that your agents and other log sources report, to identify issues and threats in your environment. Use it to investigate what happened, when and where.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.threatHunting.aboutFlyout.dashboardTerm', {
          defaultMessage: 'Dashboard',
        }),
        description: i18n.translate(
          'wazuh.threatHunting.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the events of your environment, such as the most frequent ones over time.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.threatHunting.aboutFlyout.findingsTerm', {
          defaultMessage: 'Findings',
        }),
        description: i18n.translate(
          'wazuh.threatHunting.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Lists the events so that you can search, filter and inspect each one.',
          },
        ),
      },
    ]}
    indices={[
      {
        id: 'dashboard',
        tab: TAB_VIEW_NAME_DASHBOARD,
        patterns: [WAZUH_FINDINGS_PATTERN],
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
          {i18n.translate('wazuh.threatHunting.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see what happens in your environment, then open the Findings tab to search and filter the events. Use Explore agent to focus on a single endpoint.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.threatHunting.aboutFlyout.howToStart1', {
            defaultMessage:
              'The tabs stay empty until the agents or the log sources report events.',
          })}
        </p>
      </>
    }
  />
);
