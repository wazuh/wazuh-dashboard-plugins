import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_NAMES,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_PATTERN,
  WAZUH_SCA_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import {
  AboutFlyoutButton,
  AboutFlyoutTerms,
} from '../../../../common/flyouts/about-flyout-button';
import { getScaResultDefinitions } from '../../utils/result-definitions';

export const ButtonAboutConfigurationAssessment = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.configurationAssessment.aboutFlyout.title', {
      defaultMessage: 'About Configuration Assessment',
    })}
    testSubj='ConfigurationAssessment'
    docsPath={DOCS_PATHS.configurationAssessment}
    overview={
      <>
        <p>
          {i18n.translate(
            'wazuh.configurationAssessment.aboutFlyout.whatItChecks',
            {
              defaultMessage:
                'Configuration Assessment scans your endpoints against security policies, mostly based on the CIS benchmarks. Each check verifies one setting, such as a file permission, a running service or a registry value.',
            },
          )}
        </p>
        <p>
          {i18n.translate(
            'wazuh.configurationAssessment.aboutFlyout.whyItMatters',
            {
              defaultMessage:
                'Misconfigurations widen the attack surface of an endpoint. Fixing failed checks hardens it.',
            },
          )}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.statesTerm',
          { defaultMessage: 'States' },
        ),
        description: i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.statesDescription',
          {
            defaultMessage:
              'The current result of every check on each endpoint, reported by the agent scans. Used in the Dashboard and Inventory tabs.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.findingsTerm',
          { defaultMessage: 'Findings' },
        ),
        description: i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.findingsDescription',
          {
            defaultMessage:
              'Security findings generated from Configuration Assessment events. A finding appears only when the result of a check differs between consecutive scans, so it can be empty even when States has data. Used in the Findings tab.',
          },
        ),
      },
    ]}
    extraSections={[
      {
        title: i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.resultsTitle',
          { defaultMessage: 'Results' },
        ),
        content: (
          <AboutFlyoutTerms
            terms={getScaResultDefinitions().map(({ term, description }) => ({
              title: term,
              description,
            }))}
          />
        ),
      },
    ]}
    indices={[
      {
        id: 'dashboard',
        tab: TAB_VIEW_NAME_DASHBOARD,
        patterns: [WAZUH_SCA_PATTERN],
      },
      {
        id: 'inventory',
        tab: TAB_NAMES.inventory,
        patterns: [WAZUH_SCA_PATTERN],
      },
      {
        id: 'findings',
        tab: TAB_VIEW_NAME_EVENTS,
        patterns: [WAZUH_FINDINGS_PATTERN],
      },
    ]}
    howToStart={
      <p>
        {i18n.translate(
          'wazuh.configurationAssessment.aboutFlyout.howToStart',
          {
            defaultMessage:
              'Start with the Dashboard tab to see the results of the checks across your endpoints, then open the Inventory tab to review the failed checks. The tabs stay empty until an agent reports its first scan.',
          },
        )}
      </p>
    }
  />
);
