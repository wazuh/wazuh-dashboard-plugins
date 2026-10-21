import React, { useState } from 'react';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
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
import { webDocumentationLink } from '../../../../common/services/web_documentation';

const FLYOUT_TITLE_ID = 'wzAboutSecurityTitle';
const API_RBAC_DOCS_PATH = 'user-manual/api/rbac/index.html';
const INDEXER_SECURITY_DOCS_PATH =
  'user-manual/wazuh-indexer/security.html#roles';
const AGENT_DATA_INDICES = [
  'wazuh-events-*',
  'wazuh-findings-*',
  'wazuh-states-*',
  'wazuh-active-responses-*',
  'wazuh-metrics-agents-*',
];
const DLS_QUERY_EXAMPLE = '{"terms":{"wazuh.agent.groups":["<group>"]}}';

const DocumentationLink = ({
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

export const ButtonAboutSecurity = () => {
  const [isOpen, setIsOpen] = useState(false);
  const title = i18n.translate('wazuh.security.aboutFlyout.title', {
    defaultMessage: 'About Security',
  });

  return (
    <>
      <EuiButtonEmpty
        iconType='iInCircle'
        onClick={() => setIsOpen(true)}
        data-test-subj='wzAboutSecurityButton'
      >
        {title}
      </EuiButtonEmpty>
      {isOpen && (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='m'
          ownFocus
          aria-labelledby={FLYOUT_TITLE_ID}
          data-test-subj='wzAboutSecurityFlyout'
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='s'>
              <h2 id={FLYOUT_TITLE_ID}>{title}</h2>
            </EuiTitle>
            <EuiSpacer size='xs' />
            <EuiText size='s'>
              <p>
                <FormattedMessage
                  id='wazuh.security.aboutFlyout.learnMore'
                  defaultMessage='Learn more in the {link}.'
                  values={{
                    link: (
                      <DocumentationLink path={API_RBAC_DOCS_PATH}>
                        {i18n.translate(
                          'wazuh.security.aboutFlyout.learnMoreLink',
                          { defaultMessage: 'documentation' },
                        )}
                      </DocumentationLink>
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText size='s'>
              <p>
                {i18n.translate('wazuh.security.aboutFlyout.overview', {
                  defaultMessage:
                    'This section manages the access control of the manager API. Users get roles, and roles group the policies and rules that allow or deny actions on resources.',
                })}
              </p>
            </EuiText>
            <EuiSpacer size='m' />
            <EuiDescriptionList
              compressed
              listItems={[
                {
                  title: i18n.translate(
                    'wazuh.security.aboutFlyout.usersTerm',
                    { defaultMessage: 'Users' },
                  ),
                  description: i18n.translate(
                    'wazuh.security.aboutFlyout.usersDescription',
                    {
                      defaultMessage:
                        'Manager API users. A dashboard user acts as one of them when run as is enabled.',
                    },
                  ),
                },
                {
                  title: i18n.translate(
                    'wazuh.security.aboutFlyout.rolesTerm',
                    { defaultMessage: 'Roles' },
                  ),
                  description: i18n.translate(
                    'wazuh.security.aboutFlyout.rolesDescription',
                    {
                      defaultMessage:
                        'Sets of policies and security rules assigned to users.',
                    },
                  ),
                },
                {
                  title: i18n.translate(
                    'wazuh.security.aboutFlyout.policiesTerm',
                    { defaultMessage: 'Policies' },
                  ),
                  description: i18n.translate(
                    'wazuh.security.aboutFlyout.policiesDescription',
                    {
                      defaultMessage:
                        'Allow or deny actions on resources, for example agent:read on agent:group:<group>.',
                    },
                  ),
                },
                {
                  title: i18n.translate(
                    'wazuh.security.aboutFlyout.roleMappingTerm',
                    { defaultMessage: 'Roles mapping' },
                  ),
                  description: i18n.translate(
                    'wazuh.security.aboutFlyout.roleMappingDescription',
                    {
                      defaultMessage:
                        'Security rules that assign roles to the users that authenticate, including users from an external provider.',
                    },
                  ),
                },
              ]}
            />
            <EuiSpacer size='l' />
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
                {i18n.translate(
                  'wazuh.security.aboutFlyout.indexerWarning.apiScope',
                  {
                    defaultMessage:
                      'Policies on agent:group or agent:id only limit what the manager API returns, such as the endpoints list. They do not filter the data stored in the indexer.',
                  },
                )}
              </p>
              <p>
                {i18n.translate(
                  'wazuh.security.aboutFlyout.indexerWarning.dlsRequired',
                  {
                    defaultMessage:
                      'To limit a user to an agent or a group of agents, also create an indexer role with document-level security on wazuh.agent.groups in the indices with agent data, and map it to the user:',
                  },
                )}
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
                      <DocumentationLink path={INDEXER_SECURITY_DOCS_PATH}>
                        {i18n.translate(
                          'wazuh.security.aboutFlyout.indexerWarning.docsLink',
                          { defaultMessage: 'documentation' },
                        )}
                      </DocumentationLink>
                    ),
                  }}
                />
              </p>
            </EuiCallOut>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
