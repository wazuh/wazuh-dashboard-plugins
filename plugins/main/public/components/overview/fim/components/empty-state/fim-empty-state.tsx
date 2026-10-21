import React from 'react';
import {
  EuiCallOut,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useSelector } from 'react-redux';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import NavigationService from '../../../../../react-services/navigation-service';
import { endpointSummary } from '../../../../../utils/applications';
import { FIM_CONFIGURE_DOCS_PATH } from '../../fim-documentation';
import {
  MonitoredDirectories,
  useMonitoredDirectories,
} from './use-monitored-directories';

type EmptyStateKind = 'findings' | 'dashboard';

interface FimEmptyStateProps {
  /** Tab the empty state is shown in: Findings lists changes, Dashboard the current state. */
  kind: EmptyStateKind;
  /** Pinned agent, an empty object when no agent is pinned. */
  agent?: { id?: string };
}

const getTitle = (kind: EmptyStateKind) =>
  kind === 'findings'
    ? i18n.translate('wazuh.fileIntegrityMonitoring.emptyState.findingsTitle', {
        defaultMessage: 'No file changes found',
      })
    : i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.dashboardTitle',
        { defaultMessage: 'No monitored files found' },
      );

const getDescription = (kind: EmptyStateKind) =>
  kind === 'findings'
    ? i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.findingsDescription',
        {
          defaultMessage:
            'A finding is generated when a monitored file or registry entry is added, modified or deleted after its baseline was recorded. If you expected changes, check the time range and the filters, and that the files are in a monitored directory.',
        },
      )
    : i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.dashboardDescription',
        {
          defaultMessage:
            'Monitored files appear here after the agents scan their monitored directories and record a baseline. If you expected files, check the filters, and that the files are in a monitored directory.',
        },
      );

const DefaultDirectories = () => (
  <p>
    {i18n.translate(
      'wazuh.fileIntegrityMonitoring.emptyState.defaultDirectories',
      {
        defaultMessage:
          'By default, agents monitor /etc, /usr/bin, /usr/sbin, /bin, /sbin and /boot on Linux, /private/etc, /usr/bin, /usr/sbin, /bin and /sbin on macOS, and selected system files, the Startup folder and registry keys on Windows.',
      },
    )}
  </p>
);

const EndpointConfigurationLink = ({ agentId }: { agentId: string }) => (
  <p>
    <EuiLink
      href={NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
        path: `#/agents?tab=configuration&agent=${agentId}`,
      })}
    >
      {i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.viewConfiguration',
        { defaultMessage: 'View the endpoint configuration' },
      )}
    </EuiLink>
  </p>
);

const getEndpointStatusMessage = (
  status: Exclude<MonitoredDirectories['status'], 'loading' | 'monitored'>,
) => {
  switch (status) {
    case 'none':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.noDirectories',
        {
          defaultMessage:
            'The configuration this endpoint reported has no monitored directories.',
        },
      );
    case 'disabled':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.moduleDisabled',
        {
          defaultMessage:
            'File Integrity Monitoring is disabled in the configuration this endpoint reported.',
        },
      );
    case 'not-reported':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.notReported',
        {
          defaultMessage:
            "This endpoint hasn't reported its configuration yet, so its monitored directories can't be shown. Check that configuration reporting is enabled in the agent settings.",
        },
      );
    default:
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.loadError',
        {
          defaultMessage:
            "The directories this endpoint monitors couldn't be loaded.",
        },
      );
  }
};

const EndpointDirectories = ({
  agentId,
  directories,
}: {
  agentId: string;
  directories: MonitoredDirectories;
}) => {
  if (directories.status === 'loading') {
    return (
      <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size='s' />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {i18n.translate(
            'wazuh.fileIntegrityMonitoring.emptyState.loadingDirectories',
            {
              defaultMessage: 'Loading the directories this endpoint monitors',
            },
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  if (directories.status === 'monitored') {
    return (
      <>
        <p>
          {i18n.translate(
            'wazuh.fileIntegrityMonitoring.emptyState.monitoredDirectories',
            {
              defaultMessage:
                'This endpoint monitors these directories, as it last reported:',
            },
          )}
        </p>
        <ul>
          {directories.directories.map(directory => (
            <li key={directory}>
              <EuiCode>{directory}</EuiCode>
            </li>
          ))}
        </ul>
        <EndpointConfigurationLink agentId={agentId} />
      </>
    );
  }
  const hasReport =
    directories.status === 'none' || directories.status === 'disabled';

  return (
    <>
      <p>{getEndpointStatusMessage(directories.status)}</p>
      {/* Without a readable report, the defaults are the best available answer */}
      {hasReport ? (
        <EndpointConfigurationLink agentId={agentId} />
      ) : (
        <DefaultDirectories />
      )}
    </>
  );
};

/**
 * Shown instead of the default no results callout of the File Integrity Monitoring tabs. Says
 * when data appears, which directories are monitored now and how to monitor more.
 */
export const FimEmptyStateView = ({ kind, agent }: FimEmptyStateProps) => {
  const agentId = agent?.id;
  const directories = useMonitoredDirectories(agentId);

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
      <EuiCallOut
        title={getTitle(kind)}
        color='primary'
        iconType='help'
        data-test-subj='wzFimEmptyState'
      >
        <EuiText size='s'>
          <p>{getDescription(kind)}</p>
          <div data-test-subj='wzFimEmptyStateDirectories'>
            {agentId && directories ? (
              <EndpointDirectories
                agentId={agentId}
                directories={directories}
              />
            ) : (
              <>
                <DefaultDirectories />
                <p>
                  {i18n.translate(
                    'wazuh.fileIntegrityMonitoring.emptyState.whereToSeeDirectories',
                    {
                      defaultMessage:
                        'Each endpoint that reports its configuration shows the directories it monitors in its Configuration, under Integrity monitoring.',
                    },
                  )}
                </p>
              </>
            )}
          </div>
          <p>
            <FormattedMessage
              id='wazuh.fileIntegrityMonitoring.emptyState.addDirectories'
              defaultMessage='To monitor more directories, add them to the syscheck configuration of the agent or of its group. See {link}.'
              values={{
                link: (
                  <EuiLink
                    href={webDocumentationLink(FIM_CONFIGURE_DOCS_PATH)}
                    target='_blank'
                    rel='noopener noreferrer'
                    external
                  >
                    {i18n.translate(
                      'wazuh.fileIntegrityMonitoring.emptyState.addDirectoriesLink',
                      {
                        defaultMessage:
                          'How to configure File Integrity Monitoring',
                      },
                    )}
                  </EuiLink>
                ),
              }}
            />
          </p>
        </EuiText>
      </EuiCallOut>
    </EuiPanel>
  );
};

interface PinnedAgentState {
  appStateReducers?: { currentAgentData?: { id?: string } };
}

/** Empty state of the File Integrity Monitoring tabs for the pinned agent, if any. */
export const FimEmptyState = ({ kind }: Pick<FimEmptyStateProps, 'kind'>) => {
  const agent = useSelector(
    (state: PinnedAgentState) => state.appStateReducers?.currentAgentData,
  );

  return <FimEmptyStateView kind={kind} agent={agent} />;
};
