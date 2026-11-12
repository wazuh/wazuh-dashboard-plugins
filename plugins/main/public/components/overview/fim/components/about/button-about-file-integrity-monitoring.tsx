import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  AboutFlyoutButton,
  AboutFlyoutDocsLink,
} from '../../../../common/flyouts/about-flyout-button';
import {
  TAB_NAMES,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_PATTERN,
  WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  WAZUH_FIM_REGISTRY_VALUES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';

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
      { defaultMessage: 'Last modified (mtime)' },
    ),
    description: i18n.translate(
      'wazuh.fileIntegrityMonitoring.aboutFlyout.mtimeDescription',
      {
        defaultMessage:
          'The time a file was last modified, as reported by its file system. The Last modified files table shows it in its Last modified column, newest first.',
      },
    ),
  },
];

export const ButtonAboutFileIntegrityMonitoring = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.fileIntegrityMonitoring.aboutFlyout.title', {
      defaultMessage: 'About File Integrity Monitoring',
    })}
    testSubj='FileIntegrityMonitoring'
    docsPath={DOCS_PATHS.fileIntegrityMonitoring}
    overview={
      <>
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
      </>
    }
    terms={getTermDefinitions()}
    indices={[
      {
        id: 'dashboard',
        tab: TAB_VIEW_NAME_DASHBOARD,
        patterns: [WAZUH_FIM_PATTERN],
      },
      {
        id: 'inventory',
        tab: TAB_NAMES.inventory,
        patterns: [
          WAZUH_FIM_FILES_PATTERN,
          WAZUH_FIM_REGISTRY_KEYS_PATTERN,
          WAZUH_FIM_REGISTRY_VALUES_PATTERN,
        ],
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
                <AboutFlyoutDocsLink
                  path={DOCS_PATHS.fileIntegrityMonitoringConfigure}
                >
                  {i18n.translate(
                    'wazuh.fileIntegrityMonitoring.aboutFlyout.addDirectoriesLink',
                    {
                      defaultMessage:
                        'How to configure File Integrity Monitoring',
                    },
                  )}
                </AboutFlyoutDocsLink>
              ),
            }}
          />
        </p>
      </>
    }
  />
);
