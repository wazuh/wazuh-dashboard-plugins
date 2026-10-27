import React from 'react';
import {
  EuiButton,
  EuiCallOut,
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
import { PinnedAgentManager } from '../../../../wz-agent-selector/wz-agent-selector-service';
import { DOCKER_DOCS_PATH } from '../../docker-documentation';
import {
  DockerDataStatus,
  useDockerDataEverReceived,
} from './use-docker-data-ever-received';
import { DockerListener, useDockerListener } from './use-docker-listener';

interface DockerEmptyStateProps {
  /** Whether any Docker event has ever reached the indexer. */
  dataStatus: DockerDataStatus;
  /** Pinned agent, an empty object when no agent is pinned. */
  agent?: { id?: string; name?: string };
  /** Unpins the agent so the tab shows all agents. */
  onUnpinAgent: () => void;
}

const getListenerMessage = (
  status: Exclude<DockerListener['status'], 'loading'>,
) => {
  switch (status) {
    case 'enabled':
      return i18n.translate('wazuh.docker.emptyState.listenerEnabled', {
        defaultMessage: 'The Docker listener is enabled on this endpoint.',
      });
    case 'disabled':
      return i18n.translate('wazuh.docker.emptyState.listenerDisabled', {
        defaultMessage: 'The Docker listener is disabled on this endpoint.',
      });
    case 'not-configured':
      return i18n.translate('wazuh.docker.emptyState.listenerNotConfigured', {
        defaultMessage:
          'This endpoint has no Docker listener in its configuration.',
      });
    case 'not-reported':
      return i18n.translate('wazuh.docker.emptyState.notReported', {
        defaultMessage: "This endpoint hasn't reported its configuration yet.",
      });
    default:
      return i18n.translate('wazuh.docker.emptyState.loadError', {
        defaultMessage:
          "The configuration of this endpoint couldn't be loaded.",
      });
  }
};

const EndpointListener = ({ listener }: { listener: DockerListener }) =>
  listener.status === 'loading' ? (
    <>
      <EuiLoadingSpinner size='s' />{' '}
      {i18n.translate('wazuh.docker.emptyState.loadingListener', {
        defaultMessage: 'Checking the Docker listener of this endpoint',
      })}
    </>
  ) : (
    <>{getListenerMessage(listener.status)}</>
  );

const SetUpSteps = () => (
  <>
    <p>
      {i18n.translate('wazuh.docker.emptyState.setUpIntro', {
        defaultMessage:
          'This page shows the activity of Docker containers, such as creation, start, stop and pause events. No Docker events have been received yet. To start monitoring:',
      })}
    </p>
    <ol>
      <li>
        {i18n.translate('wazuh.docker.emptyState.enableListener', {
          defaultMessage:
            'Enable the Docker listener on the agent of the Docker host.',
        })}
      </li>
      <li>
        {i18n.translate('wazuh.docker.emptyState.enableIntegration', {
          defaultMessage: 'Enable the docker integration.',
        })}
      </li>
    </ol>
  </>
);

const Actions = ({ children }: { children: React.ReactNode }) => (
  <>
    <EuiSpacer size='s' />
    <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false} wrap>
      {React.Children.toArray(children).map((child, index) => (
        <EuiFlexItem grow={false} key={index}>
          {child}
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  </>
);

/**
 * Shown instead of the default no results callout of the Docker tabs, with the same layout. When
 * no Docker event has ever arrived it explains what to enable and links the guide; otherwise it
 * keeps the usual hint about the search. For a pinned agent it also says whether the Docker
 * listener is enabled, and offers to unpin the agent.
 */
export const DockerEmptyStateView = ({
  dataStatus,
  agent,
  onUnpinAgent,
}: DockerEmptyStateProps) => {
  const agentId = agent?.id;
  const listener = useDockerListener(agentId);
  const notSetUp = dataStatus === 'never-received';

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
      <EuiCallOut
        title={
          notSetUp
            ? i18n.translate('wazuh.docker.emptyState.setUpTitle', {
                defaultMessage: "Docker monitoring isn't set up yet",
              })
            : i18n.translate('wazuh.docker.emptyState.title', {
                defaultMessage: 'No Docker events found',
              })
        }
        color='warning'
        iconType='help'
        data-test-subj='wzDockerEmptyState'
      >
        <EuiText size='s'>
          {notSetUp ? (
            <SetUpSteps />
          ) : (
            <p>
              {i18n.translate('wazuh.docker.emptyState.description', {
                defaultMessage: 'Try changing the search or time range.',
              })}
            </p>
          )}
          {listener && (
            <p>
              <EndpointListener listener={listener} />
            </p>
          )}
        </EuiText>
        <Actions>
          {agentId && (
            <EuiButton
              size='s'
              onClick={onUnpinAgent}
              data-test-subj='wzDockerEmptyStateUnpin'
            >
              {i18n.translate('wazuh.docker.emptyState.unpinAgent', {
                defaultMessage: 'Unpin agent',
              })}
            </EuiButton>
          )}
          <EuiLink
            href={webDocumentationLink(DOCKER_DOCS_PATH)}
            target='_blank'
            rel='noopener noreferrer'
            external
            data-test-subj='wzDockerEmptyStateGuide'
          >
            {i18n.translate('wazuh.docker.emptyState.guideLink', {
              defaultMessage: 'How to monitor Docker environments',
            })}
          </EuiLink>
        </Actions>
      </EuiCallOut>
    </EuiPanel>
  );
};

interface PinnedAgentState {
  appStateReducers?: { currentAgentData?: { id?: string; name?: string } };
}

const unPinAgent = () => new PinnedAgentManager().unPinAgent();

/** Empty state of the Docker tabs for the pinned agent, if any. */
export const DockerEmptyState = () => {
  const agent = useSelector(
    (state: PinnedAgentState) => state.appStateReducers?.currentAgentData,
  );
  const dataStatus = useDockerDataEverReceived();

  return (
    <DockerEmptyStateView
      dataStatus={dataStatus}
      agent={agent}
      onUnpinAgent={unPinAgent}
    />
  );
};
