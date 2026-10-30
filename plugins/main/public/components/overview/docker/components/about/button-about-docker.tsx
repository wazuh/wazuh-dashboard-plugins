import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutDocker = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.docker.aboutFlyout.title', {
      defaultMessage: 'About Docker',
    })}
    testSubj='Docker'
    docsPath={DOCS_PATHS.docker}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.docker.aboutFlyout.overview', {
            defaultMessage:
              'Docker monitors the activity of Docker containers, such as their creation, running, starting, stopping or pausing events.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.docker.aboutFlyout.dashboardTerm', {
          defaultMessage: 'Dashboard',
        }),
        description: i18n.translate(
          'wazuh.docker.aboutFlyout.dashboardDescription',
          {
            defaultMessage:
              'A summary of the container events of your environment.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.docker.aboutFlyout.findingsTerm', {
          defaultMessage: 'Findings',
        }),
        description: i18n.translate(
          'wazuh.docker.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Lists the container events so that you can search, filter and inspect each one.',
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
          {i18n.translate('wazuh.docker.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the activity of your containers, then open the Findings tab to inspect the events.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.docker.aboutFlyout.howToStart1', {
            defaultMessage:
              'The agents that run Docker need the Docker listener module enabled in their configuration. The tabs stay empty until they report events.',
          })}
        </p>
      </>
    }
  />
);
