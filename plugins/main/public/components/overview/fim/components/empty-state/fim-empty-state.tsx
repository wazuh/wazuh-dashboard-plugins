import React from 'react';
import {
  EuiCallOut,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
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

/**
 * `withCurrentState` says that the Dashboard and Inventory can have data while Findings is empty;
 * it is left out when the pinned agent monitors nothing, so the text does not contradict it.
 */
const getDescription = (kind: EmptyStateKind, withCurrentState: boolean) =>
  kind === 'findings' && !withCurrentState
    ? i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.findingsDescriptionShort',
        {
          defaultMessage:
            "Findings list the changes detected after each file's baseline was recorded. Try changing the search or time range.",
        },
      )
    : kind === 'findings'
    ? i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.findingsDescription',
        {
          defaultMessage:
            "Findings list the changes detected after each file's baseline was recorded, so this tab can be empty while the Dashboard and Inventory show the monitored files. Try changing the search or time range.",
        },
      )
    : i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.dashboardDescription',
        {
          defaultMessage:
            'Try changing the search. Monitored files appear after the agents scan their monitored directories and record a baseline.',
        },
      );

const getEndpointStatusMessage = (
  status: Exclude<MonitoredDirectories['status'], 'loading' | 'monitored'>,
) => {
  switch (status) {
    case 'none':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.noDirectories',
        { defaultMessage: 'This endpoint reports no monitored directories.' },
      );
    case 'disabled':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.moduleDisabled',
        {
          defaultMessage:
            'File Integrity Monitoring is disabled on this endpoint.',
        },
      );
    case 'not-reported':
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.notReported',
        {
          defaultMessage:
            "This endpoint hasn't reported its configuration yet.",
        },
      );
    default:
      return i18n.translate(
        'wazuh.fileIntegrityMonitoring.emptyState.loadError',
        {
          defaultMessage:
            "The monitored directories of this endpoint couldn't be loaded.",
        },
      );
  }
};

const Actions = ({ children }: { children: React.ReactNode }) => (
  <>
    <EuiSpacer size='s' />
    <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false} wrap>
      {React.Children.map(children, child => (
        <EuiFlexItem grow={false}>{child}</EuiFlexItem>
      ))}
    </EuiFlexGroup>
  </>
);

const ConfigureLink = () => (
  <EuiLink
    href={webDocumentationLink(FIM_CONFIGURE_DOCS_PATH)}
    target='_blank'
    rel='noopener noreferrer'
    external
  >
    {i18n.translate(
      'wazuh.fileIntegrityMonitoring.emptyState.addDirectoriesLink',
      { defaultMessage: 'How to configure File Integrity Monitoring' },
    )}
  </EuiLink>
);

const EndpointDirectories = ({
  directories,
}: {
  directories: MonitoredDirectories;
}) => {
  switch (directories.status) {
    case 'loading':
      return (
        <>
          <EuiLoadingSpinner size='s' />{' '}
          {i18n.translate(
            'wazuh.fileIntegrityMonitoring.emptyState.loadingDirectories',
            { defaultMessage: 'Loading the monitored directories' },
          )}
        </>
      );
    case 'monitored':
      return (
        <>
          {i18n.translate(
            'wazuh.fileIntegrityMonitoring.emptyState.monitoredDirectories',
            { defaultMessage: 'Monitored directories:' },
          )}
          {directories.directories.map(directory => (
            <React.Fragment key={directory}>
              {' '}
              <EuiCode>{directory}</EuiCode>
            </React.Fragment>
          ))}
        </>
      );
    default:
      return <>{getEndpointStatusMessage(directories.status)}</>;
  }
};

/**
 * Shown instead of the default no results callout of the File Integrity Monitoring tabs, with the
 * same layout. Says what to try, which directories the pinned agent monitors and how to add more.
 */
export const FimEmptyStateView = ({ kind, agent }: FimEmptyStateProps) => {
  const agentId = agent?.id;
  const directories = useMonitoredDirectories(agentId);
  const pinned = agentId ? directories : undefined;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
      <EuiCallOut
        title={getTitle(kind)}
        color='warning'
        iconType='help'
        data-test-subj='wzFimEmptyState'
      >
        <EuiText size='s'>
          <p>
            {getDescription(
              kind,
              !pinned || ['loading', 'monitored'].includes(pinned.status),
            )}{' '}
            {pinned ? (
              <EndpointDirectories directories={pinned} />
            ) : (
              i18n.translate(
                'wazuh.fileIntegrityMonitoring.emptyState.selectAgent',
                {
                  defaultMessage:
                    'Use Explore agent to see the directories an agent monitors.',
                },
              )
            )}
          </p>
        </EuiText>
        {!pinned ? (
          <Actions>
            <ConfigureLink />
          </Actions>
        ) : pinned.status !== 'loading' ? (
          <Actions>
            <EuiLink
              href={NavigationService.getInstance().getUrlForApp(
                endpointSummary.id,
                { path: `#/agents?tab=configuration&agent=${agentId}` },
              )}
            >
              {i18n.translate(
                'wazuh.fileIntegrityMonitoring.emptyState.viewConfiguration',
                { defaultMessage: 'View the endpoint configuration' },
              )}
            </EuiLink>
            <ConfigureLink />
          </Actions>
        ) : null}
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
