import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiSpacer, EuiText } from '@elastic/eui';
import {
  NodeStatus,
  getBlockerStateLabel,
  getContentSyncBlockers,
  getNodeBlockers,
  getReadinessAdvice,
} from './readiness';

const blockerLine = (
  daemon: string,
  resource: string | undefined,
  state: string,
) =>
  resource
    ? i18n.translate('wazuh.serverReadiness.callout.blockerWithResource', {
        defaultMessage: '{daemon}: {resource}, {state}',
        values: { daemon, resource, state },
      })
    : i18n.translate('wazuh.serverReadiness.callout.blocker', {
        defaultMessage: '{daemon}: {state}',
        values: { daemon, state },
      });

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
        <EuiText size='s'>
          <ul>
            {nodeBlockers.flatMap(({ daemon, blockers }) =>
              blockers.map(({ resource, state }) => (
                <li key={`${daemon}-${resource ?? ''}`}>
                  {blockerLine(daemon, resource, getBlockerStateLabel(state))}
                </li>
              )),
            )}
          </ul>
        </EuiText>
        <EuiSpacer size='s' />
        <EuiText size='s'>
          <p>
            {advice === 'wait'
              ? i18n.translate('wazuh.serverReadiness.callout.waitBody', {
                  defaultMessage:
                    'The first sync after an install can take 10 to 15 minutes. If it is still syncing after that, check the manager logs on this node.',
                })
              : i18n.translate('wazuh.serverReadiness.callout.actBody', {
                  defaultMessage:
                    'Check the manager logs on this node. The daemon stays not ready until this is fixed.',
                })}
          </p>
          {delaysFindings && (
            <p>
              {i18n.translate('wazuh.serverReadiness.callout.findingsDelayed', {
                defaultMessage:
                  'New findings may be delayed until the content sync completes.',
              })}
            </p>
          )}
        </EuiText>
      </EuiCallOut>
    </>
  );
};
