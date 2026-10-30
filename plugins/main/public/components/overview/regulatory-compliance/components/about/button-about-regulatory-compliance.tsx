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

export const ButtonAboutRegulatoryCompliance = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.regulatoryCompliance.aboutFlyout.title', {
      defaultMessage: 'About Regulatory Compliance',
    })}
    testSubj='RegulatoryCompliance'
    docsPath={DOCS_PATHS.regulatoryCompliance}
    overview={
      <>
        <p>
          {i18n.translate('wazuh.regulatoryCompliance.aboutFlyout.overview', {
            defaultMessage:
              'Regulatory Compliance assesses your environment against regulatory frameworks, such as PCI DSS, GDPR, HIPAA, NIST 800-53, TSC, CMMC, FedRAMP, ISO 27001, NIS2 and NIST 800-171. Each tab is one framework.',
          })}
        </p>
      </>
    }
    terms={[
      {
        title: i18n.translate(
          'wazuh.regulatoryCompliance.aboutFlyout.frameworkTerm',
          { defaultMessage: 'Framework' },
        ),
        description: i18n.translate(
          'wazuh.regulatoryCompliance.aboutFlyout.frameworkDescription',
          {
            defaultMessage:
              'A set of regulatory requirements. There is one tab for each framework.',
          },
        ),
      },
      {
        title: i18n.translate(
          'wazuh.regulatoryCompliance.aboutFlyout.requirementTerm',
          { defaultMessage: 'Requirement' },
        ),
        description: i18n.translate(
          'wazuh.regulatoryCompliance.aboutFlyout.requirementDescription',
          {
            defaultMessage:
              'A control of a framework. The events that match the rules mapped to a requirement are listed under it.',
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
        id: 'controls',
        tab: TAB_NAMES.controls,
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
          {i18n.translate(
            'wazuh.regulatoryCompliance.aboutFlyout.howToStart0',
            {
              defaultMessage:
                'Open the tab of the framework that applies to you to see which requirements your endpoints triggered.',
            },
          )}
        </p>
        <p>
          {i18n.translate(
            'wazuh.regulatoryCompliance.aboutFlyout.howToStart1',
            {
              defaultMessage:
                'A framework stays empty until an event matches a rule that is mapped to one of its requirements.',
            },
          )}
        </p>
      </>
    }
  />
);
