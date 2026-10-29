import React from 'react';
import {
  EuiCode,
  EuiDescriptionList,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import {
  WAZUH_FINDINGS_PATTERN,
  WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
  WAZUH_IT_HYGIENE_GROUPS_PATTERN,
  WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  WAZUH_IT_HYGIENE_PATTERN,
  WAZUH_IT_HYGIENE_PORTS_PATTERN,
  WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
  WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
  WAZUH_IT_HYGIENE_SERVICES_PATTERN,
  WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  WAZUH_IT_HYGIENE_USERS_PATTERN,
} from '../../../../../../common/constants';
import {
  AboutFlyoutButton,
  AboutFlyoutDocsLink,
} from '../../../../common/flyouts/about-flyout-button';

const indices = [
  {
    id: 'dashboard',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.dashboard', {
      defaultMessage: 'Dashboard',
    }),
    pattern: WAZUH_IT_HYGIENE_PATTERN,
  },
  {
    id: 'system',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.system', {
      defaultMessage: 'System > Operating system',
    }),
    pattern: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  },
  {
    id: 'hardware',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.hardware', {
      defaultMessage: 'System > Hardware',
    }),
    pattern: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  },
  {
    id: 'packages',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.packages', {
      defaultMessage: 'Software > Packages',
    }),
    pattern: WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  },
  {
    id: 'hotfixes',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.hotfixes', {
      defaultMessage: 'Software > Windows updates',
    }),
    pattern: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  },
  {
    id: 'browserExtensions',
    label: i18n.translate(
      'wazuh.itHygiene.aboutFlyout.indices.browserExtensions',
      { defaultMessage: 'Software > Browser extensions' },
    ),
    pattern: WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
  },
  {
    id: 'processes',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.processes', {
      defaultMessage: 'Processes',
    }),
    pattern: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
  },
  {
    id: 'networks',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.networks', {
      defaultMessage: 'Network > Addresses',
    }),
    pattern: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  },
  {
    id: 'interfaces',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.interfaces', {
      defaultMessage: 'Network > Interfaces',
    }),
    pattern: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  },
  {
    id: 'protocols',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.protocols', {
      defaultMessage: 'Network > Protocols',
    }),
    pattern: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
  },
  {
    id: 'ports',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.ports', {
      defaultMessage: 'Network > Listeners and Traffic',
    }),
    pattern: WAZUH_IT_HYGIENE_PORTS_PATTERN,
  },
  {
    id: 'users',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.users', {
      defaultMessage: 'Identity > Users',
    }),
    pattern: WAZUH_IT_HYGIENE_USERS_PATTERN,
  },
  {
    id: 'groups',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.groups', {
      defaultMessage: 'Identity > Groups',
    }),
    pattern: WAZUH_IT_HYGIENE_GROUPS_PATTERN,
  },
  {
    id: 'services',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.services', {
      defaultMessage: 'Services',
    }),
    pattern: WAZUH_IT_HYGIENE_SERVICES_PATTERN,
  },
  {
    id: 'findings',
    label: i18n.translate('wazuh.itHygiene.aboutFlyout.indices.findings', {
      defaultMessage: 'Findings',
    }),
    pattern: WAZUH_FINDINGS_PATTERN,
  },
];

export const ButtonAboutITHygiene = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.itHygiene.aboutFlyout.title', {
      defaultMessage: 'About IT Hygiene',
    })}
    testSubj='ITHygiene'
    docsPath='user-manual/capabilities/system-inventory/index.html'
  >
    <EuiText size='s'>
      <p>
        {i18n.translate('wazuh.itHygiene.aboutFlyout.whatItShows', {
          defaultMessage:
            'IT Hygiene is the inventory of your endpoints. It shows the operating systems, hardware, software, processes, network listeners, users and services that your agents report. Use it to know what runs on your endpoints and to spot unexpected changes, such as an unknown package or an open port.',
        })}
      </p>
    </EuiText>
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.itHygiene.aboutFlyout.tabsTitle', {
          defaultMessage: 'Tabs',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiDescriptionList
      compressed
      listItems={[
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.dashboardTab', {
            defaultMessage: 'Dashboard',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.dashboardTabDescription',
            {
              defaultMessage:
                'A summary of the whole fleet: operating systems, memory, CPUs, packages and processes.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.systemTab', {
            defaultMessage: 'System',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.systemTabDescription',
            {
              defaultMessage: 'Operating system and hardware of each endpoint.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.softwareTab', {
            defaultMessage: 'Software',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.softwareTabDescription',
            {
              defaultMessage:
                'Installed packages, hotfixes and web browser extensions.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.processesTab', {
            defaultMessage: 'Processes',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.processesTabDescription',
            {
              defaultMessage: 'Processes running on the endpoints.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.networkTab', {
            defaultMessage: 'Network',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.networkTabDescription',
            {
              defaultMessage:
                'Network interfaces, addresses, protocols, traffic and listening services.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.identityTab', {
            defaultMessage: 'Identity',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.identityTabDescription',
            {
              defaultMessage: 'User accounts and groups of the endpoints.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.servicesTab', {
            defaultMessage: 'Services',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.servicesTabDescription',
            {
              defaultMessage: 'Services configured on the endpoints.',
            },
          ),
        },
        {
          title: i18n.translate('wazuh.itHygiene.aboutFlyout.findingsTab', {
            defaultMessage: 'Findings',
          }),
          description: i18n.translate(
            'wazuh.itHygiene.aboutFlyout.findingsTabDescription',
            {
              defaultMessage:
                'Lists the changes detected between inventory scans, such as a package, user or service that was created, modified or deleted. It stays empty until something changes after the first scan.',
            },
          ),
        },
      ]}
    />
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.itHygiene.aboutFlyout.indicesTitle', {
          defaultMessage: 'Indices',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiText size='s'>
      <p>
        <FormattedMessage
          id='wazuh.itHygiene.aboutFlyout.indicesDescription'
          defaultMessage='The indexer stores the inventory in one index for each type of data, and the changes in the findings index. See the {link} of each index.'
          values={{
            link: (
              <AboutFlyoutDocsLink path='user-manual/capabilities/system-inventory/available-inventory-fields.html'>
                {i18n.translate('wazuh.itHygiene.aboutFlyout.indicesLink', {
                  defaultMessage: 'available fields',
                })}
              </AboutFlyoutDocsLink>
            ),
          }}
        />
      </p>
    </EuiText>
    <EuiSpacer size='s' />
    <EuiDescriptionList
      compressed
      listItems={indices.map(({ id, label, pattern }) => ({
        title: label,
        description: (
          <EuiCode data-test-subj={`itHygieneIndex-${id}`}>{pattern}</EuiCode>
        ),
      }))}
    />
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.itHygiene.aboutFlyout.configurationTitle', {
          defaultMessage: 'Configuration',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiText size='s'>
      <p>
        <FormattedMessage
          id='wazuh.itHygiene.aboutFlyout.configurationDescription'
          defaultMessage='The inventory comes from the Syscollector module that runs on each agent, so it has to be configured in the agents, either in the agent configuration file or for a group of agents with the centralized configuration. It is enabled by default, and the scan interval is set in the same configuration. See how to {link}.'
          values={{
            link: (
              <AboutFlyoutDocsLink path='user-manual/capabilities/system-inventory/configuration.html'>
                {i18n.translate(
                  'wazuh.itHygiene.aboutFlyout.configurationLink',
                  { defaultMessage: 'configure Syscollector' },
                )}
              </AboutFlyoutDocsLink>
            ),
          }}
        />
      </p>
    </EuiText>
    <EuiSpacer size='m' />
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate('wazuh.itHygiene.aboutFlyout.howToStartTitle', {
          defaultMessage: 'How to start',
        })}
      </h3>
    </EuiTitle>
    <EuiSpacer size='s' />
    <EuiText size='s'>
      <ul>
        <li>
          {i18n.translate('wazuh.itHygiene.aboutFlyout.howToStartDashboard', {
            defaultMessage:
              'Start with the Dashboard tab to see what the fleet looks like, then open a tab to browse the details and filter them.',
          })}
        </li>
        <li>
          {i18n.translate('wazuh.itHygiene.aboutFlyout.howToStartAgent', {
            defaultMessage:
              'Use Explore agent to see the inventory of a single endpoint.',
          })}
        </li>
        <li>
          {i18n.translate('wazuh.itHygiene.aboutFlyout.howToStartEmpty', {
            defaultMessage:
              'If a tab is empty, no agent has reported yet or the first inventory is still syncing. Check again in a few minutes.',
          })}
        </li>
      </ul>
    </EuiText>
  </AboutFlyoutButton>
);
