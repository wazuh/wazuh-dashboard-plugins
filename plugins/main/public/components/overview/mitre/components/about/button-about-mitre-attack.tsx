import React from 'react';
import { i18n } from '@osd/i18n';
import {
  TAB_NAMES,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../common/flyouts/about-flyout-button';

export const ButtonAboutMitreAttack = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.mitreAttack.aboutFlyout.title', {
      defaultMessage: 'About MITRE ATT&CK',
    })}
    testSubj='MitreAttack'
    docsPath={DOCS_PATHS.mitreAttack}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.mitreAttack.aboutFlyout.overview', {
            defaultMessage:
              'MITRE ATT&CK shows the security events mapped to the tactics and techniques of the MITRE ATT&CK knowledge base, which describes how adversaries operate.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate('wazuh.mitreAttack.aboutFlyout.tacticTerm', {
          defaultMessage: 'Tactic',
        }),
        description: i18n.translate(
          'wazuh.mitreAttack.aboutFlyout.tacticDescription',
          {
            defaultMessage:
              'The goal of an adversary, such as persistence or lateral movement.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.mitreAttack.aboutFlyout.techniqueTerm', {
          defaultMessage: 'Technique',
        }),
        description: i18n.translate(
          'wazuh.mitreAttack.aboutFlyout.techniqueDescription',
          {
            defaultMessage:
              'How an adversary achieves a tactic, such as phishing.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.mitreAttack.aboutFlyout.intelligenceTerm',
          { defaultMessage: 'Intelligence' },
        ),
        description: i18n.translate(
          'wazuh.mitreAttack.aboutFlyout.intelligenceDescription',
          {
            defaultMessage:
              'Lets you browse the MITRE ATT&CK knowledge base: groups, mitigations, software, tactics and techniques.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.mitreAttack.aboutFlyout.frameworkTerm', {
          defaultMessage: 'Framework',
        }),
        description: i18n.translate(
          'wazuh.mitreAttack.aboutFlyout.frameworkDescription',
          {
            defaultMessage:
              'Shows the tactics and techniques matched by your events.',
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
        id: 'framework',
        tab: TAB_NAMES.framework,
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
          {i18n.translate('wazuh.mitreAttack.aboutFlyout.howToStart0', {
            defaultMessage:
              'Start with the Dashboard to see the most frequent tactics and techniques, open Framework to review the techniques that your events matched, and Intelligence to read what each one means.',
          })}
        </p>
        <p>
          {i18n.translate('wazuh.mitreAttack.aboutFlyout.howToStart1', {
            defaultMessage:
              'An event appears here only when it matches a rule that is mapped to a MITRE ATT&CK technique.',
          })}
        </p>
      </>
    }
  />
);
