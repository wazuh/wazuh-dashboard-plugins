import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_NAMES,
  TAB_VIEW_NAME_DASHBOARD,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutCaseManagement = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.caseManagement.aboutFlyout.title', {
      defaultMessage: 'About Case Management',
    })}
    testSubj='CaseManagement'
    docsPath={DOCS_PATHS.caseManagement}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.caseManagement.aboutFlyout.overview', {
            defaultMessage:
              'Case Management lets you track, triage and manage the cases created from the security findings across your environment.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.caseManagement.aboutFlyout.caseTerm', {
          defaultMessage: 'Case',
        }),
        description: i18n.translate(
          'wazuh.caseManagement.aboutFlyout.caseDescription',
          {
            defaultMessage:
              'A record that follows the investigation of security findings until it is resolved.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.caseManagement.aboutFlyout.dashboardTerm',
          { defaultMessage: 'Dashboard' },
        ),
        description: i18n.translate(
          'wazuh.caseManagement.aboutFlyout.dashboardDescription',
          { defaultMessage: 'A summary of the cases of your environment.' },
        ),
      },
      {
        title: i18n.translate('wazuh.caseManagement.aboutFlyout.casesTerm', {
          defaultMessage: 'Cases',
        }),
        description: i18n.translate(
          'wazuh.caseManagement.aboutFlyout.casesDescription',
          {
            defaultMessage:
              'Lists the cases so that you can search, filter and open them.',
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
      { id: 'cases', tab: TAB_NAMES.cases, patterns: [WAZUH_FINDINGS_PATTERN] },
    ]}
    howToStart={
      <>
        <p>
          {i18n.translate('wazuh.caseManagement.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the state of your cases, then open the Cases tab to find and review them.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.caseManagement.aboutFlyout.howToStart1', {
            defaultMessage:
              'The tabs stay empty until a case is created from a security finding.',
          })}
        </p>
      </>
    }
  />
);
