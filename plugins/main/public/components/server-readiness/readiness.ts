/*
 * Reads the per-daemon readiness that `GET /cluster/{node}/status` returns and
 * says what keeps a daemon from being ready.
 */
import { i18n } from '@osd/i18n';

/** `updating` and `failed` come from the server; `unavailable` covers the rest. */
export type BlockerState = 'updating' | 'failed' | 'unavailable' | 'stopped';

export interface ReadinessBlocker {
  /** What is not ready, e.g. `Content space "standard"`. Absent for the daemon itself. */
  resource?: string;
  state: BlockerState;
  /** True for content spaces: events wait on them before becoming findings. */
  contentSpace?: boolean;
}

/** `wait` while everything is still syncing, `act` once something failed. */
export type ReadinessAdvice = 'wait' | 'act';

interface SyncResource {
  available?: boolean;
  enabled?: boolean;
  status?: string;
}

export interface DaemonStatus {
  ready?: boolean;
  running?: boolean;
  reason?: string;
  spaces?: Record<string, SyncResource>;
  ioc?: Record<string, SyncResource>;
  geo?: Record<string, SyncResource>;
  modules?: Record<string, SyncResource>;
  global?: { available?: boolean };
}

export type NodeStatus = Record<string, DaemonStatus | boolean>;

const toState = (status?: string): BlockerState =>
  status === 'updating' || status === 'failed' ? status : 'unavailable';

const resourceBlockers = (
  resources: Record<string, SyncResource> | undefined,
  label: (name: string) => string,
  extra: Partial<ReadinessBlocker> = {},
): ReadinessBlocker[] =>
  Object.entries(resources ?? {})
    .filter(
      ([, resource]) => resource?.enabled !== false && !resource?.available,
    )
    .map(([name, resource]) => ({
      resource: label(name),
      state: toState(resource?.status),
      ...extra,
    }));

/** What keeps one daemon from being ready. Empty when it is ready. */
export const getDaemonBlockers = (daemon: DaemonStatus): ReadinessBlocker[] => {
  if (!daemon || daemon.ready === true) {
    return [];
  }
  if (daemon.running === false) {
    return [{ state: 'stopped' }];
  }

  const blockers = [
    ...resourceBlockers(
      daemon.spaces,
      name =>
        i18n.translate('wazuh.serverReadiness.resource.contentSpace', {
          defaultMessage: 'Content space "{name}"',
          values: { name },
        }),
      { contentSpace: true },
    ),
    ...resourceBlockers(daemon.ioc, name =>
      i18n.translate('wazuh.serverReadiness.resource.ioc', {
        defaultMessage: 'IOC database "{name}"',
        values: { name },
      }),
    ),
    ...resourceBlockers(daemon.geo, name =>
      i18n.translate('wazuh.serverReadiness.resource.geo', {
        defaultMessage: 'GeoIP database "{name}"',
        values: { name },
      }),
    ),
  ];

  const feed = daemon.modules?.['vulnerability-detector'];
  if (
    feed &&
    feed.enabled !== false &&
    !(feed.available && feed.status === 'ready')
  ) {
    blockers.push({
      resource: i18n.translate(
        'wazuh.serverReadiness.resource.vulnerabilityFeed',
        {
          defaultMessage: 'Vulnerability feed',
        },
      ),
      state: toState(feed.status),
    });
  }

  if (daemon.global?.available === false) {
    blockers.push({
      resource: i18n.translate('wazuh.serverReadiness.resource.globalDb', {
        defaultMessage: 'Global database',
      }),
      state: 'unavailable',
    });
  }
  if (daemon.reason) {
    blockers.push({ resource: daemon.reason, state: 'unavailable' });
  }
  return blockers;
};

/** `wait` when every blocker is still syncing, `act` otherwise. */
export const getReadinessAdvice = (
  blockers: ReadinessBlocker[],
): ReadinessAdvice | null => {
  if (!blockers.length) {
    return null;
  }
  return blockers.every(({ state }) => state === 'updating') ? 'wait' : 'act';
};

/** Daemons of a node that are not ready, each with its blockers. */
export const getNodeBlockers = (
  node: NodeStatus,
): { daemon: string; blockers: ReadinessBlocker[] }[] =>
  Object.entries(node ?? {})
    .filter(([key, value]) => key !== 'ready' && typeof value === 'object')
    .map(([daemon, value]) => ({
      daemon,
      blockers: getDaemonBlockers(value as DaemonStatus),
    }))
    .filter(({ blockers }) => blockers.length > 0);

/** Content-space blockers of a node: while any is left, findings may be delayed. */
export const getContentSyncBlockers = (node: NodeStatus): ReadinessBlocker[] =>
  getNodeBlockers(node).flatMap(({ blockers }) =>
    blockers.filter(({ contentSpace }) => contentSpace),
  );

export const getBlockerStateLabel = (state: BlockerState): string => {
  switch (state) {
    case 'updating':
      return i18n.translate('wazuh.serverReadiness.state.updating', {
        defaultMessage: 'syncing',
      });
    case 'failed':
      return i18n.translate('wazuh.serverReadiness.state.failed', {
        defaultMessage: 'sync failed',
      });
    case 'stopped':
      return i18n.translate('wazuh.serverReadiness.state.stopped', {
        defaultMessage: 'not running',
      });
    default:
      return i18n.translate('wazuh.serverReadiness.state.unavailable', {
        defaultMessage: 'not available',
      });
  }
};
