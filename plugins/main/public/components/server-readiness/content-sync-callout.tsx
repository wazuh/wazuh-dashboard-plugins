import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { getCore } from '../../kibana-services';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { serverStatus } from '../../utils/applications';
import {
  NodeStatus,
  getContentSyncBlockers,
  getReadinessAdvice,
} from './readiness';

interface PendingSync {
  nodes: string[];
  failed: boolean;
}

/** Nodes whose content sync is not done, read once. `null` when all are done or unknown. */
export const usePendingContentSync = (): PendingSync | null => {
  const [pending, setPending] = useState<PendingSync | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nodes = await WzRequest.apiReq('GET', '/cluster/nodes', {
          params: { select: 'name' },
        });
        const names: string[] = (nodes?.data?.data?.affected_items ?? []).map(
          ({ name }: { name: string }) => name,
        );
        // One unreachable node must not hide the others.
        const statuses = await Promise.allSettled(
          names.map(async name => {
            const response = await WzRequest.apiReq(
              'GET',
              `/cluster/${name}/status`,
              {},
            );
            const node: NodeStatus = response?.data?.data?.affected_items?.[0];
            return { name, blockers: getContentSyncBlockers(node) };
          }),
        );
        const syncing = statuses.flatMap(result =>
          result.status === 'fulfilled' && result.value.blockers.length
            ? [result.value]
            : [],
        );
        if (!cancelled && syncing.length) {
          setPending({
            nodes: syncing.map(({ name }) => name),
            failed: syncing.some(
              ({ blockers }) => getReadinessAdvice(blockers) === 'act',
            ),
          });
        }
      } catch {
        // No access to the cluster status, or the API is down: nothing to say here.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return pending;
};

/** Warns that new findings may be delayed while a node's content sync is not done. */
export const ContentSyncCallout: React.FC = () => {
  const pending = usePendingContentSync();
  if (!pending) {
    return null;
  }
  const nodes = pending.nodes.join(', ');

  return (
    <>
      <EuiCallOut
        size='s'
        color={pending.failed ? 'warning' : 'primary'}
        iconType={pending.failed ? 'alert' : 'clock'}
        title={
          pending.failed
            ? i18n.translate('wazuh.serverReadiness.contentSync.failedTitle', {
                defaultMessage:
                  'Content sync failed on {nodes}. New findings may be delayed.',
                values: { nodes },
              })
            : i18n.translate(
                'wazuh.serverReadiness.contentSync.updatingTitle',
                {
                  defaultMessage:
                    'Content sync in progress on {nodes}. New findings may be delayed.',
                  values: { nodes },
                },
              )
        }
        data-test-subj='content-sync-callout'
      >
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={getCore().application.getUrlForApp(serverStatus.id)}>
            {i18n.translate('wazuh.serverReadiness.contentSync.link', {
              defaultMessage: 'View details in Server status',
            })}
          </EuiLink>
        </RedirectAppLinks>
      </EuiCallOut>
      <EuiSpacer size='m' />
    </>
  );
};
