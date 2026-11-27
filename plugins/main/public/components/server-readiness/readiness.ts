/*
 * Reads the per-daemon readiness that `GET /cluster/{node}/status` returns and
 * says what keeps a daemon from being ready.
 */
import { i18n } from '@osd/i18n';

/**
 * `updating` and `failed` come from the server, `unreachable` when the manager could not ask a
 * daemon, `unavailable` covers the rest.
 */
export type BlockerState =
  'updating' | 'failed' | 'unavailable' | 'unreachable' | 'stopped';

export interface ReadinessBlocker {
  /** What is not ready, e.g. `Content space "standard"`. Absent for the daemon itself. */
  resource?: string;
  state: BlockerState;
  /** True for content spaces: events wait on them before becoming findings. */
  contentSpace?: boolean;
  /** Unix seconds of the last successful sync; 0 when it never synced. */
  lastSync?: number;
  /** The manager's own explanation, as it sent it. */
  detail?: string;
}

/** A daemon's state: `notReady` when the server gives no reason. */
export type DaemonState = 'ready' | 'notReady' | BlockerState;

/** `wait` while everything is still syncing, `act` once something failed. */
export type ReadinessAdvice = 'wait' | 'act';

interface SyncResource {
  available?: boolean;
  enabled?: boolean;
  status?: string;
  last_successful_update?: number;
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
  enrollment_password?: { ready?: boolean };
}

export type NodeStatus = Record<string, DaemonStatus | boolean>;

const toState = (status?: string): BlockerState =>
  status === 'updating' || status === 'failed' ? status : 'unavailable';

const withLastSync = (resource: SyncResource) =>
  typeof resource?.last_successful_update === 'number'
    ? { lastSync: resource.last_successful_update }
    : {};

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
      ...withLastSync(resource),
      ...extra,
    }));

const ANALYSISD = 'wazuh-manager-analysisd';

/** What keeps one daemon from being ready. Empty when it is ready. */
export const getDaemonBlockers = (
  daemon: DaemonStatus,
  name?: string,
): ReadinessBlocker[] => {
  if (!daemon || daemon.ready === true) {
    return [];
  }
  if (daemon.running === false) {
    return [{ state: 'stopped' }];
  }
  // The manager sends analysisd without `spaces` only when the engine did not answer.
  if (name === ANALYSISD && !daemon.spaces) {
    return [
      {
        resource: i18n.translate('wazuh.serverReadiness.resource.engine', {
          defaultMessage: 'Engine',
        }),
        state: 'unreachable',
      },
    ];
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
      // The module always reports `last_successful_update`: without it, the manager could not
      // reach the module and filled in `failed` itself.
      state:
        feed.last_successful_update === undefined
          ? 'unreachable'
          : toState(feed.status),
      ...withLastSync(feed),
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
  if (daemon.enrollment_password?.ready === false) {
    blockers.push({
      resource: i18n.translate(
        'wazuh.serverReadiness.resource.enrollmentPassword',
        { defaultMessage: 'Enrollment password' },
      ),
      state: 'unavailable',
    });
  }
  // Sent with `ready: false` only by wazuh-db, when its status endpoint did not answer.
  if (daemon.reason) {
    blockers.push({
      resource: i18n.translate(
        'wazuh.serverReadiness.resource.statusEndpoint',
        {
          defaultMessage: 'Status endpoint',
        },
      ),
      state: 'unreachable',
      detail: daemon.reason,
    });
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
      blockers: getDaemonBlockers(value as DaemonStatus, daemon),
    }))
    .filter(({ blockers }) => blockers.length > 0);

/** Content-space blockers of a node: while any is left, findings may be delayed. */
export const getContentSyncBlockers = (node: NodeStatus): ReadinessBlocker[] =>
  getNodeBlockers(node).flatMap(({ blockers }) =>
    blockers.filter(({ contentSpace }) => contentSpace),
  );

const SEVERITY: DaemonState[] = [
  'ready',
  'updating',
  'notReady',
  'unavailable',
  'unreachable',
  'failed',
  'stopped',
];

/** The most severe state of a daemon's blockers. */
export const getDaemonState = (
  daemon: DaemonStatus,
  name?: string,
): DaemonState => {
  if (!daemon || daemon.ready === true) {
    return 'ready';
  }
  const blockers = getDaemonBlockers(daemon, name);
  if (!blockers.length) {
    return 'notReady';
  }
  return blockers
    .map(({ state }) => state as DaemonState)
    .reduce((worst, state) =>
      SEVERITY.indexOf(state) > SEVERITY.indexOf(worst) ? state : worst,
    );
};

export const getStateLabel = (state: DaemonState): string => {
  switch (state) {
    case 'ready':
      return i18n.translate('wazuh.serverReadiness.state.ready', {
        defaultMessage: 'Ready',
      });
    case 'notReady':
      return i18n.translate('wazuh.serverReadiness.state.notReady', {
        defaultMessage: 'Not ready',
      });
    case 'updating':
      return i18n.translate('wazuh.serverReadiness.state.updating', {
        defaultMessage: 'Syncing',
      });
    case 'failed':
      return i18n.translate('wazuh.serverReadiness.state.failed', {
        defaultMessage: 'Sync failed',
      });
    case 'unreachable':
      return i18n.translate('wazuh.serverReadiness.state.unreachable', {
        defaultMessage: 'Not responding',
      });
    case 'stopped':
      return i18n.translate('wazuh.serverReadiness.state.stopped', {
        defaultMessage: 'Not running',
      });
    default:
      return i18n.translate('wazuh.serverReadiness.state.unavailable', {
        defaultMessage: 'Not available',
      });
  }
};
