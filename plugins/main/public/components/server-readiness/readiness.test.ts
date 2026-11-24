/* eslint-disable camelcase -- the manager API responses are snake_case */
import {
  getContentSyncBlockers,
  getDaemonBlockers,
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
        modulesd({ enabled: true, available: true, status: 'updating' }),
      ),
    ).toEqual([{ resource: 'Vulnerability feed', state: 'updating' }]);
    expect(
      getDaemonBlockers(
        modulesd({ enabled: false, available: false, status: 'failed' }),
      ),
    ).toEqual([]);
  });

  it('reports the wazuh-db global database and any reason given', () => {
    expect(
      getDaemonBlockers({
        ready: false,
        running: true,
        global: { available: false },
        reason: 'status endpoint unreachable: timeout',
      }),
    ).toEqual([
      { resource: 'Global database', state: 'unavailable' },
      {
        resource: 'status endpoint unreachable: timeout',
        state: 'unavailable',
      },
    ]);
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
