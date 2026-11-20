/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
import type { CtiConsumer } from '../../../common/cti-consumers';
import {
  getFeedCatalogLabel,
  getFeedMetadata,
  sortFeeds,
} from './feed-metadata';

const consumer = (type: string, name = type): CtiConsumer => ({
  name,
  context: `${name}-context`,
  type,
  resource: '',
  is_public: true,
  status: 'ready',
  local_offset: 0,
  remote_offset: 0,
});

describe('feed metadata', () => {
  test('names the known feeds by their consumer type', () => {
    expect(
      getFeedMetadata(consumer('cti:catalog:consumer:iocs', 'public-iocs-5'))
        .label,
    ).toBe('Indicators of compromise');
  });

  test('falls back to the consumer name for an unknown feed', () => {
    const metadata = getFeedMetadata(consumer('cti:catalog:consumer:other'));

    expect(metadata.label).toBe('cti:catalog:consumer:other');
    expect(metadata.description).toBe('cti:catalog:consumer:other-context');
  });

  test('sorts known feeds first, then the rest by name', () => {
    const sorted = sortFeeds([
      consumer('z-unknown', 'zeta'),
      consumer('cti:catalog:consumer:vulnerabilities'),
      consumer('a-unknown', 'alpha'),
      consumer('cti:catalog:consumer:ruleset'),
      consumer('cti:catalog:consumer:iocs'),
    ]);

    expect(sorted.map(item => item.type)).toEqual([
      'cti:catalog:consumer:ruleset',
      'cti:catalog:consumer:iocs',
      'cti:catalog:consumer:vulnerabilities',
      'a-unknown',
      'z-unknown',
    ]);
  });
});

describe('getFeedCatalogLabel', () => {
  test('names the catalog the Open feed installs', () => {
    expect(
      getFeedCatalogLabel(
        consumer('cti:catalog:consumer:iocs', 'public-iocs-5'),
      ),
    ).toBe('Open catalog');
  });

  test('names the catalog the Professional feed installs', () => {
    expect(
      getFeedCatalogLabel({
        ...consumer('cti:catalog:consumer:iocs', 'private-iocs-5'),
        is_public: false,
      }),
    ).toBe('Professional catalog');
  });
});
