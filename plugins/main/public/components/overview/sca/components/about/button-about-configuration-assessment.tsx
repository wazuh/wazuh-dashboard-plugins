import React, { useState } from 'react';
import {
  EuiButtonEmpty,
  EuiDescriptionList,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { getScaResultDefinitions } from '../../utils/result-definitions';

const FLYOUT_TITLE_ID = 'wzAboutConfigurationAssessmentTitle';

export const ButtonAboutConfigurationAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const title = i18n.translate(
    'wazuh.configurationAssessment.aboutFlyout.title',
    { defaultMessage: 'About Configuration Assessment' },
  );

  return (
    <>
      <EuiButtonEmpty
        iconType='iInCircle'
        onClick={() => setIsOpen(true)}
        data-test-subj='wzAboutConfigurationAssessmentButton'
      >
        {title}
      </EuiButtonEmpty>
      {isOpen && (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='s'
          ownFocus
          aria-labelledby={FLYOUT_TITLE_ID}
          data-test-subj='wzAboutConfigurationAssessmentFlyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='m'>
              <h2 id={FLYOUT_TITLE_ID}>{title}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText size='s'>
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
            </EuiText>
            <EuiSpacer />
            <EuiTitle size='xs'>
              <h3>
                {i18n.translate(
                  'wazuh.configurationAssessment.aboutFlyout.dataSourcesTitle',
                  { defaultMessage: 'Data sources' },
                )}
              </h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiDescriptionList
              compressed
              listItems={[
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
            />
            <EuiSpacer />
            <EuiTitle size='xs'>
              <h3>
                {i18n.translate(
                  'wazuh.configurationAssessment.aboutFlyout.resultsTitle',
                  { defaultMessage: 'Results' },
                )}
              </h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiDescriptionList
              compressed
              listItems={getScaResultDefinitions().map(
                ({ term, description }) => ({ title: term, description }),
              )}
            />
            <EuiSpacer />
            <EuiText size='s'>
              <p>
                <FormattedMessage
                  id='wazuh.configurationAssessment.aboutFlyout.learnMore'
                  defaultMessage='Learn more in the {link} documentation.'
                  values={{
                    link: (
                      <EuiLink
                        href={webDocumentationLink(
                          'user-manual/capabilities/sec-config-assessment/index.html',
                        )}
                        target='_blank'
                        rel='noopener noreferrer'
                        external
                      >
                        {i18n.translate(
                          'wazuh.configurationAssessment.aboutFlyout.learnMoreLink',
                          {
                            defaultMessage: 'Security Configuration Assessment',
                          },
                        )}
                      </EuiLink>
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
