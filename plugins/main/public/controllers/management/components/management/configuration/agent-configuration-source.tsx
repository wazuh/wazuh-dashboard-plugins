import React from 'react';
import {
  EuiCallOut,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../kibana-services';
import { getGroupConfigurationEditorUrl } from '../groups/utils/group-configuration';

const AGENT_CONF = <EuiCode>agent.conf</EuiCode>;
const OSSEC_CONF = <EuiCode>ossec.conf</EuiCode>;

// Built on render, so the text follows the locale loaded by then
const LearnMoreLink = () => (
  <EuiLink
    href={webDocumentationLink(DOCS_PATHS.centralizedConfiguration)}
    target='_blank'
    external
    rel='noopener noreferrer'
  >
    {i18n.translate('wazuh.configuration.agentConfigurationSource.learnMore', {
      defaultMessage: 'Learn more about centralized configuration',
    })}
  </EuiLink>
);

const ReadOnlyNotice = ({ hasGroups }: { hasGroups: boolean }) => (
  <EuiCallOut
    size='s'
    iconType='iInCircle'
    title={i18n.translate(
      'wazuh.configuration.agentConfigurationSource.readOnlyTitle',
      { defaultMessage: 'These settings are read-only' },
    )}
    data-test-subj='agent-configuration-read-only-notice'
  >
    <p>
      {hasGroups ? (
        <FormattedMessage
          id='wazuh.configuration.agentConfigurationSource.readOnlyWithGroupsDescription'
          defaultMessage="Change them in the {agentConf} file of the agent's groups, with the edit shortcuts below, or in the local {ossecConf} file of the agent. The settings in {agentConf} override the local file. {learnMore}"
          values={{
            agentConf: AGENT_CONF,
            ossecConf: OSSEC_CONF,
            learnMore: <LearnMoreLink />,
          }}
        />
      ) : (
        <FormattedMessage
          id='wazuh.configuration.agentConfigurationSource.readOnlyWithoutGroupsDescription'
          defaultMessage='Change them in the local {ossecConf} file of the agent, or assign the agent to a group and change them in the {agentConf} file of the group, which overrides the local file. {learnMore}'
          values={{
            agentConf: AGENT_CONF,
            ossecConf: OSSEC_CONF,
            learnMore: <LearnMoreLink />,
          }}
        />
      )}
    </p>
  </EuiCallOut>
);

const EditGroupConfigurationShortcuts = ({ groups }: { groups: string[] }) => (
  <RedirectAppLinks application={getCore().application}>
    <EuiFlexGroup
      gutterSize='s'
      alignItems='center'
      wrap
      responsive={false}
      data-test-subj='agent-configuration-group-shortcuts'
    >
      <EuiFlexItem grow={false}>
        <EuiText size='s'>
          {i18n.translate(
            'wazuh.configuration.agentConfigurationSource.editGroupConfigurationLabel',
            { defaultMessage: 'Edit group configuration:' },
          )}
        </EuiText>
      </EuiFlexItem>
      {groups.map(group => (
        <EuiFlexItem grow={false} key={group}>
          <WzButtonPermissions
            buttonType='empty'
            size='s'
            iconType='documentEdit'
            permissions={[
              { action: 'group:update_config', resource: `group:id:${group}` },
            ]}
            href={getGroupConfigurationEditorUrl(group)}
            aria-label={i18n.translate(
              'wazuh.configuration.agentConfigurationSource.editGroupConfigurationAriaLabel',
              {
                defaultMessage: 'Edit the configuration of the {group} group',
                values: { group },
              },
            )}
            data-test-subj={`agent-configuration-edit-group-${group}`}
          >
            {group}
          </WzButtonPermissions>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  </RedirectAppLinks>
);

/**
 * Tells where the settings of an agent come from and links to the editor of
 * each of its groups' configuration, the place to change them.
 */
export const AgentConfigurationSource = ({
  groups = [],
}: {
  groups?: string[];
}) => (
  <>
    <ReadOnlyNotice hasGroups={groups.length > 0} />
    <EuiSpacer size='s' />
    {groups.length > 0 && (
      <>
        <EditGroupConfigurationShortcuts groups={groups} />
        <EuiSpacer size='s' />
      </>
    )}
  </>
);
