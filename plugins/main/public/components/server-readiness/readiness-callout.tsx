import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import {
  BlockerState,
  NodeStatus,
  getBlockerStateLabel,
  getContentSyncBlockers,
  getNodeBlockers,
  getReadinessAdvice,
} from './readiness';

const BADGE_COLORS: Record<BlockerState, string> = {
  updating: 'hollow',
  failed: 'warning',
  unavailable: 'warning',
  stopped: 'danger',
};

// The daemon list above already shows the full name.
const shortName = (daemon: string) => daemon.replace(/^wazuh-manager-/, '');

const adviceText = (advice: 'wait' | 'act', delaysFindings: boolean) => {
  if (advice === 'wait') {
    return delaysFindings
      ? i18n.translate('wazuh.serverReadiness.callout.waitFindingsBody', {
          defaultMessage:
            'New findings may be delayed until the sync completes. The first sync after an install can take 10 to 15 minutes; if it takes longer, check the manager logs on this node.',
        })
      : i18n.translate('wazuh.serverReadiness.callout.waitBody', {
          defaultMessage:
            'The first sync after an install can take 10 to 15 minutes; if it takes longer, check the manager logs on this node.',
        });
  }
  return delaysFindings
    ? i18n.translate('wazuh.serverReadiness.callout.actFindingsBody', {
        defaultMessage:
          'Check the manager logs on this node. New findings may be delayed until the content sync completes.',
      })
    : i18n.translate('wazuh.serverReadiness.callout.actBody', {
        defaultMessage: 'Check the manager logs on this node.',
      });
};

/** Says what keeps a node from being ready, and whether to wait or act. */
export const ReadinessCallout: React.FC<{ node: NodeStatus }> = ({ node }) => {
  const nodeBlockers = getNodeBlockers(node);
  const advice = getReadinessAdvice(
    nodeBlockers.flatMap(({ blockers }) => blockers),
  );
  if (!advice) {
    return null;
  }
  const delaysFindings = getContentSyncBlockers(node).length > 0;

  return (
    <>
      <EuiSpacer size='m' />
      <EuiCallOut
        size='s'
        color={advice === 'wait' ? 'primary' : 'warning'}
        iconType={advice === 'wait' ? 'clock' : 'alert'}
        title={
          advice === 'wait'
            ? i18n.translate('wazuh.serverReadiness.callout.waitTitle', {
                defaultMessage: 'Syncing, no action needed yet',
              })
            : i18n.translate('wazuh.serverReadiness.callout.actTitle', {
                defaultMessage: 'Action needed',
              })
        }
        data-test-subj='server-readiness-callout'
      >
        {nodeBlockers.flatMap(({ daemon, blockers }) =>
          blockers.map(({ resource, state }) => (
            <EuiFlexGroup
              key={`${daemon}-${resource ?? ''}`}
              gutterSize='s'
              alignItems='center'
              responsive={false}
              data-test-subj='server-readiness-blocker'
            >
              <EuiFlexItem>
                <EuiText size='s'>
                  <strong>{shortName(daemon)}</strong>
                  {resource && <span>{` · ${resource}`}</span>}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge color={BADGE_COLORS[state]}>
                  {getBlockerStateLabel(state)}
                </EuiBadge>
              </EuiFlexItem>
            </EuiFlexGroup>
          )),
        )}
        <EuiSpacer size='s' />
        <EuiText size='s' color='subdued'>
          <p>{adviceText(advice, delaysFindings)}</p>
        </EuiText>
      </EuiCallOut>
    </>
  );
};
