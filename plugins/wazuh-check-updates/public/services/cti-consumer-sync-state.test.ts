/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
import type { CtiConsumer } from '../../common/cti-consumers';
import {
  getConsumerSyncState,
  getFeedSyncSummary,
  isFeedSyncInProgress,
} from './cti-consumer-sync-state';

const consumer = (overrides: Partial<CtiConsumer> = {}): CtiConsumer => ({
  name: 'public-ruleset-5',
  context: 'rc2-t1-ruleset-5',
  type: 'cti:catalog:consumer:ruleset',
  resource: 'https://example.test/consumer',
  is_public: true,
  status: 'ready',
  local_offset: 10,
  remote_offset: 10,
  ...overrides,
});

describe('getConsumerSyncState', () => {
  test('is up to date when ready with matching offsets', () => {
    expect(getConsumerSyncState(consumer())).toEqual({ kind: 'upToDate' });
  });

  test('is pending when ready but behind the remote', () => {
    expect(
      getConsumerSyncState(consumer({ local_offset: 4, remote_offset: 10 })),
    ).toEqual({ kind: 'pending' });
  });

  test('reports the progress of a running sync', () => {
    expect(
      getConsumerSyncState(
        consumer({ status: 'running', local_offset: 25, remote_offset: 100 }),
      ),
    ).toEqual({ kind: 'syncing', progress: 0.25 });
  });

  test('has no progress when the remote offset is unknown', () => {
    expect(
      getConsumerSyncState(
        consumer({ status: 'running', local_offset: 0, remote_offset: 0 }),
      ),
    ).toEqual({ kind: 'syncing', progress: null });
  });

  test('is failed when the consumer failed', () => {
    expect(getConsumerSyncState(consumer({ status: 'failed' }))).toEqual({
      kind: 'failed',
    });
  });

  test('keeps any other status as unknown', () => {
    expect(getConsumerSyncState(consumer({ status: 'paused' }))).toEqual({
      kind: 'unknown',
      rawStatus: 'paused',
    });
  });
});

describe('getFeedSyncSummary', () => {
  test('is empty without consumers', () => {
    expect(getFeedSyncSummary([])).toBe('empty');
  });

  test('is up to date when every feed is', () => {
    expect(getFeedSyncSummary([consumer(), consumer()])).toBe('upToDate');
  });

  test('leads with the state that most needs attention', () => {
    const failed = consumer({ status: 'failed' });
    const syncing = consumer({ status: 'running' });
    const pending = consumer({ local_offset: 1 });
    const unknown = consumer({ status: 'paused' });

    expect(getFeedSyncSummary([syncing, failed, pending])).toBe('failed');
    expect(getFeedSyncSummary([pending, syncing, consumer()])).toBe('syncing');
    expect(getFeedSyncSummary([unknown, pending])).toBe('pending');
    expect(getFeedSyncSummary([consumer(), unknown])).toBe('unknown');
  });
});

describe('isFeedSyncInProgress', () => {
  test('only while syncing or pending', () => {
    expect(isFeedSyncInProgress('syncing')).toBe(true);
    expect(isFeedSyncInProgress('pending')).toBe(true);
    expect(isFeedSyncInProgress('upToDate')).toBe(false);
    expect(isFeedSyncInProgress('failed')).toBe(false);
    expect(isFeedSyncInProgress('empty')).toBe(false);
  });
});
