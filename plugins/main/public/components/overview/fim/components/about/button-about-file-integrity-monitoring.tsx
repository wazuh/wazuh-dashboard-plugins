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

const FLYOUT_TITLE_ID = 'wzAboutFileIntegrityMonitoringTitle';

const ExternalDocLink = ({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) => (
  <EuiLink
    href={webDocumentationLink(path)}
    target='_blank'
    rel='noopener noreferrer'
    external
  >
    {children}
  </EuiLink>
);

const getTermDefinitions = () => [
  {
    title: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.baselineTerm',
      { defaultMessage: 'Baseline' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.baselineDescription',
      {
        defaultMessage:
          'The checksums and attributes, such as size, owner, permissions and mtime, that the agent records for each monitored file and registry entry. A baselined file is a file with a recorded baseline.',
      },
    ),
  },
  {
    title: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.currentStateTerm',
      { defaultMessage: 'Current state' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.currentStateDescription',
      {
        defaultMessage:
          'The baseline as last reported by each agent, that is, what the monitored files and registry entries look like now. Used in the Dashboard and Inventory tabs.',
      },
    ),
  },
  {
    title: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.inventoryTerm',
      { defaultMessage: 'Inventory' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.inventoryDescription',
      {
        defaultMessage:
          'Lists the current state of every monitored file, registry key and registry value on each endpoint.',
      },
    ),
  },
  {
    title: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.findingsTerm',
      { defaultMessage: 'Findings' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.findingsDescription',
      {
        defaultMessage:
          'Lists the changes: a finding is generated when a monitored file or registry entry is added, modified or deleted after its baseline was recorded. It stays empty until something changes in a monitored path, even when Inventory has data.',
      },
    ),
  },
  {
    title: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.mtimeTerm',
      { defaultMessage: 'mtime' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.mtimeDescription',
      {
        defaultMessage:
          'The time a file was last modified, as reported by its file system. The Last modified files table sorts files by it.',
      },
    ),
  },
];

export const ButtonAboutFileIntegrityMonitoring = () => {
  const [isOpen, setIsOpen] = useState(false);
  const title = i18n.translate(
    'wazuh.fileIntegrityMonitoring.aboutFlyout.title',
    { defaultMessage: 'About File Integrity Monitoring' },
  );

  return (
    <>
      <EuiButtonEmpty
        iconType='iInCircle'
        onClick={() => setIsOpen(true)}
        data-test-subj='wzAboutFileIntegrityMonitoringButton'
      >
        {title}
      </EuiButtonEmpty>
      {isOpen && (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='m'
          ownFocus
          aria-labelledby={FLYOUT_TITLE_ID}
          data-test-subj='wzAboutFileIntegrityMonitoringFlyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='s'>
              <h2 id={FLYOUT_TITLE_ID}>{title}</h2>
            </EuiTitle>
            <EuiSpacer size='xs' />
            <EuiText size='s'>
              <p>
                <FormattedMessage
                  id='wazuh.fileIntegrityMonitoring.aboutFlyout.learnMore'
                  defaultMessage='Learn more in the {link}.'
                  values={{
                    link: (
                      <ExternalDocLink path='user-manual/capabilities/file-integrity/index.html'>
                        {i18n.translate(
                          'wazuh.fileIntegrityMonitoring.aboutFlyout.learnMoreLink',
                          { defaultMessage: 'documentation' },
                        )}
                      </ExternalDocLink>
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText size='s'>
              <p>
                {i18n.translate(
                  'wazuh.fileIntegrityMonitoring.aboutFlyout.whatItDoes',
                  {
                    defaultMessage:
                      'File Integrity Monitoring detects when files and registry entries are created, modified or deleted in the paths that the agents monitor. With who-data monitoring enabled, it also records the user and process that made each change.',
                  },
                )}
              </p>
              <p>
                {i18n.translate(
                  'wazuh.fileIntegrityMonitoring.aboutFlyout.howItWorks',
                  {
                    defaultMessage:
                      'Each agent first scans the monitored paths to record a baseline. Later scans, and real-time or who-data monitoring when enabled, compare every file against its baseline and report each difference as a finding.',
                  },
                )}
              </p>
            </EuiText>
            <EuiSpacer size='m' />
            <EuiTitle size='xs'>
              <h3>
                {i18n.translate(
                  'wazuh.fileIntegrityMonitoring.aboutFlyout.termsTitle',
                  { defaultMessage: 'Terms' },
                )}
              </h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiDescriptionList compressed listItems={getTermDefinitions()} />
            <EuiSpacer size='m' />
            <EuiTitle size='xs'>
              <h3>
                {i18n.translate(
                  'wazuh.fileIntegrityMonitoring.aboutFlyout.gettingStartedTitle',
                  { defaultMessage: 'Getting started' },
                )}
              </h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiText size='s'>
              <p>
                {i18n.translate(
                  'wazuh.fileIntegrityMonitoring.aboutFlyout.defaultDirectories',
                  {
                    defaultMessage:
                      'Agents monitor only a few system directories by default. To see which ones an endpoint monitors, open the endpoint, select Configuration and find Monitored directories under Integrity monitoring.',
                  },
                )}
              </p>
              <p>
                <FormattedMessage
                  id='wazuh.fileIntegrityMonitoring.aboutFlyout.addDirectories'
                  defaultMessage='To monitor your own files, add their directories to the syscheck configuration of the agent or of its group. See {link}.'
                  values={{
                    link: (
                      <ExternalDocLink path='user-manual/capabilities/file-integrity/how-to-configure-fim.html'>
                        {i18n.translate(
                          'wazuh.fileIntegrityMonitoring.aboutFlyout.addDirectoriesLink',
                          {
                            defaultMessage:
                              'How to configure File Integrity Monitoring',
                          },
                        )}
                      </ExternalDocLink>
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
