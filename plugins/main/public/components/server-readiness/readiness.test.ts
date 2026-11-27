/* eslint-disable camelcase -- the manager API responses are snake_case */
import {
  getContentSyncBlockers,
  getDaemonBlockers,
  getDaemonState,
  getNodeBlockers,
  getReadinessAdvice,
} from './readiness';

// Shape returned by `GET /cluster/{node}/status` on a 5.0.0 manager.
const analysisd = (standardStatus: string, standardAvailable = false) => ({
  ready: false,
  running: true,
  spaces: {
    standard: {
      available: standardAvailable,
      enabled: true,
      status: standardStatus,
    },
    custom: { available: false, enabled: false, status: 'ready' },
  },
  ioc: { hash_md5: { available: true, status: 'ready' } },
  geo: { city: { available: true, status: 'ready' } },
});

describe('getDaemonBlockers', () => {
  it('returns nothing for a ready daemon', () => {
    expect(getDaemonBlockers({ ready: true, running: true })).toEqual([]);
  });

  it('reports a stopped daemon', () => {
    expect(getDaemonBlockers({ ready: false, running: false })).toEqual([
      { state: 'stopped' },
    ]);
  });

  it('reports enabled content spaces that are not available, and skips disabled ones', () => {
    expect(getDaemonBlockers(analysisd('failed'))).toEqual([
      {
        resource: 'Content space "standard"',
        state: 'failed',
        contentSpace: true,
      },
    ]);
  });

  it('reports IOC and GeoIP databases that are not available', () => {
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        ioc: { url_full: { available: false, status: 'updating' } },
        geo: { asn: { available: false, status: 'weird' } },
      }),
    ).toEqual([
      { resource: 'IOC database "url_full"', state: 'updating' },
      { resource: 'GeoIP database "asn"', state: 'unavailable' },
    ]);
  });

  it('reports the vulnerability feed until it is available and ready', () => {
    const modulesd = (feed: object) => ({
      ready: false,
      running: true,
      modules: {
        'vulnerability-detector': feed,
        'task-manager': { available: true },
      },
    });
    expect(
      getDaemonBlockers(
        modulesd({
          enabled: true,
          available: true,
          status: 'updating',
          last_successful_update: 1795797672,
        }),
      ),
    ).toEqual([
      {
        resource: 'Vulnerability feed',
        state: 'updating',
        lastSync: 1795797672,
      },
    ]);
    expect(
      getDaemonBlockers(
        modulesd({ enabled: false, available: false, status: 'failed' }),
      ),
    ).toEqual([]);
  });

  it('reports a vulnerability module the manager could not reach', () => {
    // What the manager sends when the module does not answer.
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        modules: {
          'vulnerability-detector': { available: false, status: 'failed' },
        },
      }),
    ).toEqual([{ resource: 'Vulnerability feed', state: 'unreachable' }]);
  });

  it('reports an engine that did not answer', () => {
    expect(
      getDaemonBlockers(
        { ready: false, running: true },
        'wazuh-manager-analysisd',
      ),
    ).toEqual([{ resource: 'Engine', state: 'unreachable' }]);
  });

  it('reports an enrollment password that is not ready', () => {
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        enrollment_password: { ready: false },
      }),
    ).toEqual([{ resource: 'Enrollment password', state: 'unavailable' }]);
  });

  it('reports the wazuh-db global database and an unreachable status endpoint', () => {
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        global: { available: false },
      }),
    ).toEqual([{ resource: 'Global database', state: 'unavailable' }]);
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        reason: 'status endpoint unreachable: timeout',
      }),
    ).toEqual([
      {
        resource: 'Status endpoint',
        state: 'unreachable',
        detail: 'status endpoint unreachable: timeout',
      },
    ]);
  });
});

describe('lastSync', () => {
  it('carries the last successful sync of a resource, 0 when it never synced', () => {
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        spaces: {
          standard: {
            available: false,
            enabled: true,
            status: 'failed',
            last_successful_update: 0,
          },
        },
        ioc: {
          url_full: {
            available: false,
            status: 'updating',
            last_successful_update: 1795462428,
          },
        },
      }),
    ).toEqual([
      {
        resource: 'Content space "standard"',
        state: 'failed',
        contentSpace: true,
        lastSync: 0,
      },
      {
        resource: 'IOC database "url_full"',
        state: 'updating',
        lastSync: 1795462428,
      },
    ]);
  });
});

describe('getDaemonState', () => {
  it('is ready for a ready daemon', () => {
    expect(getDaemonState({ ready: true, running: true })).toBe('ready');
  });

  it('is notReady when the server gives no reason', () => {
    expect(getDaemonState({ ready: false, running: true })).toBe('notReady');
  });

  it('takes the most severe blocker', () => {
    expect(
      getDaemonState({
        ready: false,
        running: true,
        ioc: { url_full: { available: false, status: 'updating' } },
        geo: { asn: { available: false, status: 'failed' } },
      }),
    ).toBe('failed');
    expect(getDaemonState({ ready: false, running: false })).toBe('stopped');
  });
});

describe('getReadinessAdvice', () => {
  it('says to wait while everything is syncing', () => {
    expect(getReadinessAdvice([{ resource: 'a', state: 'updating' }])).toBe(
      'wait',
    );
  });

  it('says to act once anything failed or is unavailable', () => {
    expect(
      getReadinessAdvice([
        { resource: 'a', state: 'updating' },
        { resource: 'b', state: 'failed' },
      ]),
    ).toBe('act');
    expect(getReadinessAdvice([{ state: 'stopped' }])).toBe('act');
  });

  it('says nothing without blockers', () => {
    expect(getReadinessAdvice([])).toBeNull();
  });
});

describe('node helpers', () => {
  const node = {
    'wazuh-manager-analysisd': analysisd('updating'),
    'wazuh-manager-authd': { ready: true, running: true },
    'wazuh-manager-db': {
      ready: false,
      running: true,
      reason: 'status endpoint unreachable',
    },
    ready: false,
  };

  it('lists only the daemons that are not ready, skipping the node flag', () => {
    expect(getNodeBlockers(node).map(({ daemon }) => daemon)).toEqual([
      'wazuh-manager-analysisd',
      'wazuh-manager-db',
    ]);
  });

  it('keeps only content-space blockers for the findings delay', () => {
    expect(getContentSyncBlockers(node)).toEqual([
      {
        resource: 'Content space "standard"',
        state: 'updating',
        contentSpace: true,
      },
    ]);
    expect(
      getContentSyncBlockers({
        'wazuh-manager-analysisd': analysisd('ready', true),
      }),
    ).toEqual([]);
  });
});
