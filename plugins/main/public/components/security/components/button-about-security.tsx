import React from 'react';
import { EuiCallOut, EuiCodeBlock, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DOCS_PATHS } from '../../../../common/services/docs-paths';
import {
  AboutFlyoutButton,
  AboutFlyoutDocsLink,
} from '../../common/flyouts/about-flyout-button';
import {
  WAZUH_ACTIVE_RESPONSES_PATTERN,
  WAZUH_AGENT_CONFIG_PATTERN,
  WAZUH_AGENT_STATS_PATTERN,
  WAZUH_METRICS_AGENTS_PATTERN,
  WAZUH_METRICS_COMMS_PATTERN,
} from '../../../../common/constants';

const AGENT_DATA_INDICES = [
  'wazuh-events-*',
  'wazuh-findings-*',
  'wazuh-states-*',
  WAZUH_ACTIVE_RESPONSES_PATTERN,
  WAZUH_METRICS_AGENTS_PATTERN,
  WAZUH_METRICS_COMMS_PATTERN,
  WAZUH_AGENT_STATS_PATTERN,
  WAZUH_AGENT_CONFIG_PATTERN,
];
const DLS_QUERY_EXAMPLE = '{"terms":{"wazuh.agent.groups":["<group>"]}}';
const DLS_AGENT_ID_QUERY_EXAMPLE = '{"term":{"wazuh.agent.id":"<agent id>"}}';

export const ButtonAboutSecurity = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.security.aboutFlyout.title', {
      defaultMessage: 'About API access control',
    })}
    testSubj='Security'
    docsPath={DOCS_PATHS.apiRbac}
    overview={
      <p>
        {i18n.translate('wazuh.security.aboutFlyout.overview', {
          defaultMessage:
            'This section manages the access control of the Wazuh API. Users get roles, and roles group the policies and rules that allow or deny actions on resources.',
        })}
      </p>
    }
    terms={[
      {
        title: i18n.translate('wazuh.security.aboutFlyout.usersTerm', {
          defaultMessage: 'Users',
        }),
        description: i18n.translate(
          'wazuh.security.aboutFlyout.usersDescription',
          {
            defaultMessage:
              'Wazuh API users. The dashboard connects as the API user set in the host configuration. With run as, the roles come from Roles mapping instead.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.security.aboutFlyout.rolesTerm', {
          defaultMessage: 'Roles',
        }),
        description: i18n.translate(
          'wazuh.security.aboutFlyout.rolesDescription',
          {
            defaultMessage:
              'Sets of policies and security rules assigned to users.',
          },
        ),
      },
      {
        title: i18n.translate('wazuh.security.aboutFlyout.policiesTerm', {
          defaultMessage: 'Policies',
        }),
        description: (
          <FormattedMessage
            id='wazuh.security.aboutFlyout.policiesDescription'
            defaultMessage='Allow or deny actions on resources, for example {action} on {resource}.'
            values={{
              action: <code>agent:read</code>,
              resource: <code>agent:group:&lt;group&gt;</code>,
            }}
          />
        ),
      },
      {
        title: i18n.translate('wazuh.security.aboutFlyout.roleMappingTerm', {
          defaultMessage: 'Roles mapping',
        }),
        description: i18n.translate(
          'wazuh.security.aboutFlyout.roleMappingDescription',
          {
            defaultMessage:
              'Security rules that assign roles to the users that authenticate, including users from an external provider.',
          },
        ),
      },
    ]}
    extraSections={[
      {
        title: i18n.translate('wazuh.security.aboutFlyout.indexerTitle', {
          defaultMessage: 'Indexer permissions',
        }),
        content: (
          <EuiCallOut
            color='warning'
            iconType='alert'
            data-test-subj='wzAboutSecurityIndexerWarning'
            title={i18n.translate(
              'wazuh.security.aboutFlyout.indexerWarning.title',
              {
                defaultMessage:
                  'Agent restrictions also need indexer permissions',
              },
            )}
          >
            <p>
              <FormattedMessage
                id='wazuh.security.aboutFlyout.indexerWarning.apiScope'
                defaultMessage='Policies on {group} or {id} only limit what the Wazuh API returns, such as the endpoints list. They do not filter the data stored in the indexer.'
                values={{
                  group: <code>agent:group</code>,
                  id: <code>agent:id</code>,
                }}
              />
            </p>
            <p>
              <FormattedMessage
                id='wazuh.security.aboutFlyout.indexerWarning.dlsRequired'
                defaultMessage='To limit a user to an agent or a group of agents, also create an indexer role with document-level security on {field} in the indices with agent data, and map it to the user:'
                values={{ field: <code>wazuh.agent.groups</code> }}
              />
            </p>
            <ul>
              {AGENT_DATA_INDICES.map(index => (
                <li key={index}>
                  <code>{index}</code>
                </li>
              ))}
            </ul>
            <EuiCodeBlock language='json' paddingSize='s' isCopyable>
              {DLS_QUERY_EXAMPLE}
            </EuiCodeBlock>
            <EuiSpacer size='s' />
            <p>
              {i18n.translate(
                'wazuh.security.aboutFlyout.indexerWarning.agentIdExample',
                {
                  defaultMessage:
                    'To limit a user to a single agent, use its ID instead:',
                },
              )}
            </p>
            <EuiCodeBlock language='json' paddingSize='s' isCopyable>
              {DLS_AGENT_ID_QUERY_EXAMPLE}
            </EuiCodeBlock>
            <EuiSpacer size='s' />
            <p>
              {i18n.translate(
                'wazuh.security.aboutFlyout.indexerWarning.indexTime',
                {
                  defaultMessage:
                    'The group is stored in each document when it is indexed, so a change in the group membership of an agent only applies to the data indexed afterwards.',
                },
              )}
            </p>
            <p>
              <FormattedMessage
                id='wazuh.security.aboutFlyout.indexerWarning.docs'
                defaultMessage='Roles and role mappings of the indexer are described in the {link}.'
                values={{
                  link: (
                    <AboutFlyoutDocsLink path={DOCS_PATHS.indexerSecurityRoles}>
                      {i18n.translate(
                        'wazuh.security.aboutFlyout.indexerWarning.docsLink',
                        { defaultMessage: 'documentation' },
                      )}
                    </AboutFlyoutDocsLink>
                  ),
                }}
              />
            </p>
          </EuiCallOut>
        ),
      },
    ]}
    howToStart={
      <p>
        {i18n.translate('wazuh.security.aboutFlyout.howToStart', {
          defaultMessage:
            'Create the policies you need, group them in a role and assign the role to a user. To assign roles to users that authenticate with an external provider, use Roles mapping.',
        })}
      </p>
    }
  />
);
