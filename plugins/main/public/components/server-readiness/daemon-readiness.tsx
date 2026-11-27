import React from 'react';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIcon,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  DaemonState,
  DaemonStatus,
  NodeStatus,
  ReadinessBlocker,
  getContentSyncBlockers,
  getDaemonBlockers,
  getDaemonState,
  getNodeBlockers,
  getReadinessAdvice,
  getStateLabel,
} from './readiness';
import './daemon-readiness.scss';

const HEALTH_COLORS: Record<DaemonState, string> = {
  ready: 'success',
  updating: 'warning',
  notReady: 'warning',
  failed: 'danger',
  unavailable: 'danger',
  unreachable: 'danger',
  stopped: 'danger',
};

const adviceText = (advice: 'wait' | 'act', delaysFindings: boolean) => {
  if (advice === 'wait') {
    return delaysFindings
      ? i18n.translate('wazuh.serverReadiness.advice.waitFindings', {
          defaultMessage:
            "New findings may be delayed until the sync completes. If it doesn't finish, check the manager logs on this node.",
        })
      : i18n.translate('wazuh.serverReadiness.advice.wait', {
          defaultMessage:
            "No action needed while it syncs. If it doesn't finish, check the manager logs on this node.",
        });
  }
  return delaysFindings
    ? i18n.translate('wazuh.serverReadiness.advice.actFindings', {
        defaultMessage:
          'Check the manager logs on this node. New findings may be delayed until the content sync completes.',
      })
    : i18n.translate('wazuh.serverReadiness.advice.act', {
        defaultMessage: 'Check the manager logs on this node.',
      });
};

const summaryText = (ready: boolean, advice: 'wait' | 'act' | null) => {
  if (ready) {
    return i18n.translate('wazuh.serverReadiness.summary.ready', {
      defaultMessage: 'Ready',
    });
  }
  if (advice === 'wait') {
    return i18n.translate('wazuh.serverReadiness.summary.syncing', {
      defaultMessage: 'Not ready · syncing',
    });
  }
  if (advice === 'act') {
    return i18n.translate('wazuh.serverReadiness.summary.needsAttention', {
      defaultMessage: 'Not ready · needs attention',
    });
  }
  return i18n.translate('wazuh.serverReadiness.summary.notReady', {
    defaultMessage: 'Not ready',
  });
};

const lastSyncText = (lastSync: number) =>
  lastSync > 0
    ? i18n.translate('wazuh.serverReadiness.lastSync', {
        defaultMessage: 'last synced {time}',
        values: { time: moment.unix(lastSync).fromNow() },
      })
    : i18n.translate('wazuh.serverReadiness.neverSynced', {
        defaultMessage: 'never synced',
      });

const BlockerRow: React.FC<{ blocker: ReadinessBlocker }> = ({ blocker }) => (
  <EuiFlexGroup
    gutterSize='s'
    alignItems='center'
    responsive={false}
    className='wzDaemonReadiness__blocker'
    data-test-subj='server-readiness-blocker'
  >
    <EuiFlexItem className='wzDaemonReadiness__shrink'>
      <EuiText size='xs'>
        <span title={blocker.detail}>{blocker.resource}</span>
        {blocker.state === 'updating' && (
          <EuiLoadingSpinner size='s' className='wzDaemonReadiness__spinner' />
        )}
      </EuiText>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size='xs' color='subdued'>
        <span>{getStateLabel(blocker.state)}</span>
        {blocker.lastSync !== undefined && (
          <>
            <span aria-hidden> · </span>
            <span>{lastSyncText(blocker.lastSync)}</span>
          </>
        )}
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const DaemonRow: React.FC<{ name: string; daemon: DaemonStatus }> = ({
  name,
  daemon,
}) => {
  const state = getDaemonState(daemon, name);
  // A stopped daemon has nothing more to say than its state.
  const blockers = getDaemonBlockers(daemon, name).filter(
    ({ resource }) => resource,
  );
  return (
    <div
      className='wzDaemonReadiness__row'
      data-test-subj='server-readiness-daemon'
    >
      <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
        <EuiFlexItem className='wzDaemonReadiness__shrink'>
          <EuiHealth color={HEALTH_COLORS[state]}>{name}</EuiHealth>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size='xs' color={state === 'ready' ? 'subdued' : 'default'}>
            {getStateLabel(state)}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      {blockers.map((blocker, index) => (
        <BlockerRow key={index} blocker={blocker} />
      ))}
    </div>
  );
};

/** The daemons of a node, with what keeps each from being ready. */
export const DaemonReadiness: React.FC<{ node: NodeStatus }> = ({ node }) => {
  const daemons = Object.entries(node ?? {})
    .filter(([key, value]) => key !== 'ready' && typeof value === 'object')
    .sort(([a], [b]) => a.localeCompare(b)) as [string, DaemonStatus][];
  const advice = getReadinessAdvice(
    getNodeBlockers(node).flatMap(({ blockers }) => blockers),
  );
  const ready = node?.ready === true;
  const summaryColor = ready
    ? 'success'
    : advice === 'act'
      ? 'danger'
      : 'warning';

  return (
    <>
      <EuiFlexGroup alignItems='center' gutterSize='m' responsive={false} wrap>
        <EuiFlexItem grow={false}>
          <EuiTitle size='m'>
            <h2>
              {i18n.translate('wazuh.serverStatus.daemons.title', {
                defaultMessage: 'Daemons',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiHealth
            color={summaryColor}
            data-test-subj='server-readiness-summary'
          >
            {summaryText(ready, advice)}
          </EuiHealth>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <div>
        {daemons.map(([name, daemon]) => (
          <DaemonRow key={name} name={name} daemon={daemon} />
        ))}
      </div>
      {advice && (
        <>
          <EuiSpacer size='m' />
          <EuiFlexGroup
            gutterSize='s'
            responsive={false}
            data-test-subj='server-readiness-advice'
          >
            <EuiFlexItem grow={false}>
              <EuiIcon type='iInCircle' color='subdued' aria-hidden />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size='xs' color='subdued'>
                {adviceText(advice, getContentSyncBlockers(node).length > 0)}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
