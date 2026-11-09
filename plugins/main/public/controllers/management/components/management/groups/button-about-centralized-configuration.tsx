import React from 'react';
import { EuiCode } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../../../components/common/flyouts/about-flyout-button';

const getGuideItems = () => [
  {
    title: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.structureTerm',
      { defaultMessage: 'Structure' },
    ),
    description: (
      <FormattedMessage
        id='wazuh.endpointGroups.editor.aboutFlyout.structureDescription'
        defaultMessage='Settings go inside {agentConfig} blocks. One file can have several blocks.'
        values={{ agentConfig: <EuiCode>{'<agent_config>'}</EuiCode> }}
      />
    ),
  },
  {
    title: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.targetingTerm',
      { defaultMessage: 'Targeting agents' },
    ),
    description: (
      <FormattedMessage
        id='wazuh.endpointGroups.editor.aboutFlyout.targetingDescription'
        defaultMessage='The {name}, {os} and {profile} attributes are regular expressions matched against the agent name, the agent OS and its {configProfile}. When attributes are combined, the agent must match all of them. A block without attributes applies to every agent in the group.'
        values={{
          name: <EuiCode>name</EuiCode>,
          os: <EuiCode>os</EuiCode>,
          profile: <EuiCode>profile</EuiCode>,
          configProfile: <EuiCode>{'<config-profile>'}</EuiCode>,
        }}
      />
    ),
  },
  {
    title: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.precedenceTerm',
      { defaultMessage: 'Precedence' },
    ),
    description: (
      <FormattedMessage
        id='wazuh.endpointGroups.editor.aboutFlyout.precedenceDescription'
        defaultMessage="{agentConf} settings override the same settings in the agent's local configuration. If an agent belongs to several groups, their configurations are merged in the order the groups were assigned to the agent, and on a conflict the group assigned last wins."
        values={{ agentConf: <EuiCode>agent.conf</EuiCode> }}
      />
    ),
  },
  {
    title: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.applyingTerm',
      { defaultMessage: 'Applying changes' },
    ),
    description: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.applyingDescription',
      {
        defaultMessage:
          "The manager distributes the saved file to the group's agents automatically. No restart is needed.",
      },
    ),
  },
  {
    title: i18n.translate(
      'wazuh.endpointGroups.editor.aboutFlyout.validationTerm',
      { defaultMessage: 'Validation' },
    ),
    description: (
      <FormattedMessage
        id='wazuh.endpointGroups.editor.aboutFlyout.validationDescription'
        defaultMessage='The editor checks the XML format before saving, but not whether the settings are valid. To check them, run {tool} on the manager.'
        values={{ tool: <EuiCode>verify-agent-conf</EuiCode> }}
      />
    ),
  },
];

export const ButtonAboutCentralizedConfiguration = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.endpointGroups.editor.aboutFlyout.title', {
      defaultMessage: 'About centralized configuration',
    })}
    testSubj='CentralizedConfiguration'
    docsPath={DOCS_PATHS.centralizedConfiguration}
    overview={
      <p>
        <FormattedMessage
          id='wazuh.endpointGroups.editor.aboutFlyout.whatItDoes'
          defaultMessage="The group's {agentConf} file holds the configuration shared by the agents of the group. It is added to the local configuration of each agent."
          values={{ agentConf: <EuiCode>agent.conf</EuiCode> }}
        />
      </p>
    }
    terms={getGuideItems()}
    howToStart={
      <p>
        <FormattedMessage
          id='wazuh.endpointGroups.editor.aboutFlyout.howToStart'
          defaultMessage='Add an {agentConfig} block with the settings that the agents of the group need, then save the file.'
          values={{ agentConfig: <EuiCode>{'<agent_config>'}</EuiCode> }}
        />
      </p>
    }
  />
);
